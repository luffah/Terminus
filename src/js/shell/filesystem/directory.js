var POPREFIX_CMD = 'cmd_'
var POPREFIX_ROOM = 'room_'
var POPREFIX_ITEM = 'item_'
var POPREFIX_LINK = 'link'
var POPREFIX_ROOMLINK = 'link'
var POPREFIX_PEOPLE = 'people_'
var POSUFFIX_DESC = '_text'
var PO_NONE = 'none'
var PO_NONE_DESC = PO_NONE + POSUFFIX_DESC
var PO_DEFAULT_ROOM = POPREFIX_ROOM + PO_NONE
var PO_DEFAULT_ITEM = POPREFIX_ITEM + PO_NONE
var PO_DEFAULT_LINK = POPREFIX_LINK
var PO_DEFAULT_ROOMLINK = POPREFIX_ROOMLINK
var PO_DEFAULT_PEOPLE = POPREFIX_PEOPLE + PO_NONE
var PO_DEFAULT_ROOM_DESC = POPREFIX_ROOM + PO_NONE_DESC
var PO_DEFAULT_ITEM_DESC = POPREFIX_ITEM + PO_NONE_DESC
var PO_DEFAULT_PEOPLE_DESC = POPREFIX_PEOPLE + PO_NONE_DESC
var globalSpec = {}

function Room (prop) {
  prop = prop || {}
  console.log('room ' + prop.id, prop.var)
  this.children = []
  this.items = []
  this.starter_msg = prop.starterMsg
  this.enter_callback = prop.enterCallback || null
  this.leave_callback = prop.leaveCallback || null
  if (!prop.mod) { prop.mod = 755 }
  if (!prop.name) { prop.name = prop.poid }
  File.call(this, prop)
    // name || _(PO_DEFAULT_ROOM),
    // text || _(PO_DEFAULT_ROOM_DESC),
}
function enterRoom (new_room, vt) {
  let ctx = vt.ctx
  console.log('enterRoom', new_room, ctx)
  let prev = ctx.h.r
  if (prev && !prev.isParentOf(new_room)) {
    prev.doLeaveCallbackTo(new_room)
  }
  ctx.h.r = new_room
  state.saveContext(ctx)
  if (new_room.music) {
    vt.playMusic(new_room.music, { loop: true })
  }
  if (typeof new_room.enter_callback === 'function') {
    new_room.enter_callback(new_room, vt)
  }
  if (typeof enter_room_effect === 'function') {
    enter_room_effect()
  }
  return [new_room.toString(), new_room.text]
}
Room.parse = function (str) {
  return window[str]
}
Room.prototype = union(File.prototype, {
  _set: File.prototype.set,
  set: function (prop) {
    this._set(prop)
    let h
    if (h = prop.peoples) {
      Object.keys(h).forEach((i) => {
        this.newPeople(i, h[i])
      })
    }
    if (h = prop.items) {
      let re_batch = /(\w*){(\w+(,\w+)*)}/
      Object.keys(h).forEach((i) => {
        let m = i.match(re_batch)
        if (m) {
          this.newItemBatch(m[1], m[2].split(','), h[i])
        } else {
          this.newItem(i, h[i])
        }
      })
    }
    if (prop.children) {
      h = prop.children
      Object.keys(h).forEach((i) => {
        this.newRoom(i, h[i])
      })
    }
    if (prop.tree) {
      Object.keys(h).forEach((i) => {
        this.newRoom(i, h[i])
      })
    }
    return this
  },
  isRoot: function () { return !this.room },
  getDoors: function () { return this.tgt.children },
  getItems: function () { return this.tgt.items.filter((o) => !(o instanceof People)) },
  getPeoples: function () { return this.tgt.items.filter((o) => (o instanceof People)) },
  // a message displayed on game start
  setStarterMsg: function (txt) { this.tgt.starter_msg = txt; return this.tgt },
  getStarterMsg: function (prefix) {
    prefix = prefix || ''
    if (this.tgt.starter_msg) {
      return prefix + this.tgt.starter_msg
    } else {
      return prefix + _(POPREFIX_CMD + 'pwd', [this.tgt.name]).concat('\n').concat(this.tgt.text)
    }
  },
  // sub room management
  idxChildFromName: function (name) {
    return this.tgt.children.map(objToStr).indexOf(name)
  },
  getChildFromName: function (name) {
    let idx = this.idxChildFromName(name)
    return ((idx == -1) ? null : this.children[idx])
  },
  hasChild: function (child) { return this.getChildFromName(child.name) },
  addDoor: function (f, wayback) {
    if (f) {
      let i = 0
      let name = f.name
      while (this.idxChildFromName(f.name) != -1) {
        f.name = name + '.' + (++i)
      }
      this.children.push(f)
      if (d(wayback, true)) {
        f.room = this.tgt
      }
    }
    return this.tgt
  },
  removeDoor: function (child) { if (rmIdxOf(this.children, child)) { child.room = null } },
  getRoot: function () { return (this.room ? this.tgt.getRoot() : this) },
  getDir: function (arg, ctx) {
    let r = null

    if (arg === '') {
      r = ctx.h.r.getRoot()
    } else if (arg === '~') {
      r = ctx.h.v.HOME || ctx.h.r.getRoot()
    } else if (arg === '..') {
      r = this.room
    } else if (arg === '.') {
      r = this
    } else if (arg && arg.indexOf('/') == -1) {
      r = this.tgt.children.filter((i) => arg == i.toString()).shift()
    }
    return (r) || null
  },
  // callback when entering in the room
  setLeaveCallback: function (fu) { this.tgt.leave_callback = fu; return this },
  doLeaveCallbackTo: function (to) {
    t = this
    console.log(t.toString(), 'doLeaveCallbackTo', to.toString())
    if (t.uid != to.uid && t.room) {
      if (typeof t.leave_callback === 'function') {
        t.leave_callback()
      }
      t.room.doLeaveCallbackTo(to)
    }
  },
  setEnterCallback: function (fu) { this.tgt.enter_callback = fu; return this },
  doEnterCallbackTo: function (to) {
    t = this
    if (t.uid === to.uid) {
    } else if (t.children.length) {
      if (typeof t.leave_callback === 'function') {
        t.enter_callback()
      }
      if (t.room) {
        t.room.doEnterCallbackTo(to)
      }
    }
  },
  isParentOf: function (par) { return par.room && (par.room.uid == this.uid || this.isParentOf(par.room)) },
  destroy: function () { rmIdxOf(this.room.children, this); this.room = null },
  setOutsideEvt: function (name, fun) { globalSpec[this.name][name] = fun; return this },
  unsetOutsideEvt: function (name) { delete globalSpec[this.name][name]; return this },
  isEmpty: function () { return (this.tgt.children.length === 0 && this.tgt.items.length === 0) },
  /* Returns the room and the item corresponding to the path
   * if item is null, then the path describe a room and  room is the full path
   * else room is the room containing the item */
  traversee: function (path) {
    // log(path)
    let [room, lastcomponent] = this.pathToRoom(path)
    let ret = { room: room, item_name: lastcomponent, item_idx: -1 }
    if (room) {
      ret.room_name = room.name
      if (lastcomponent) {
        ret.item = ret.room.tgt.items.find((it, i) =>
          lastcomponent === it.toString() && (ret.item_idx = i) + 1)
      }
    }
    return ret
  },
  checkAccess: function (ctx) {
    let c = ctx.h.r.tgt
    let r = this.tgt
    if (c.uid == r.uid) {
      return true
    } else if (r.isParentOf(c)) {
      return r.ismod('x', ctx)
    } else if (c.isParentOf(r)) {
      return r.ismod('x', ctx) && r.room.checkAccess(ctx)
    } else {
      return r.ismod('x', ctx) && (!r.room || r.room.checkAccess(ctx))
    }
  },
  pathToRoom: function (path) {
    // returns [ room associated to the path,
    //           non room part of path,
    //           valid path ]
    let room = this.tgt
    // log(path)
    let pat = path.split('/')
    let end = pat.slice(0, -1).findIndex((r) => !(room = room.getDir(r)))
    let pathstr = pat.slice(0, end).join('/')
    let lastcomponent = null
    let cancd
    if (room) {
      lastcomponent = pat.pop() || null
      if (cancd = room.getDir(lastcomponent)) {
        room = cancd
        pathstr += (end <= 0 ? '' : '/') + lastcomponent + '/'
        lastcomponent = null
      }
    }
    return [room, lastcomponent, pathstr]
  },
  // item & people management
  addItem: function (f) {
    if (f) {
      let i = 0
      let name = f.name
      while (this.tgt.idxItemFromName(f.name) != -1) {
        f.name = name + '.' + (++i)
      }
      this.items.push(f)
      f.room = this.tgt
    }
    return this.tgt
  },
  removeItemByIdx: function (idx) {
    return ((idx == -1) ? null : this.tgt.items.splice(idx, 1)[0])
  },
  idxItemFromName: function (name) {
    return this.tgt.items.map(objToStr).indexOf(name)
  },
  removeItemByName: function (name) {
    idx = this.tgt.idxItemFromName(name)
    return this.tgt.removeItemByIdx(idx)
  },
  hasItem: function (name, args) {
    args = args || []
    idx = this.tgt.idxItemFromName(_(POPREFIX_ITEM + name, args))
    return (idx > -1)
  },
  removeItem: function (name, args) {
    args = args || []
    idx = this.tgt.idxItemFromName(_(POPREFIX_ITEM + name, args))
    return this.tgt.removeItemByIdx(idx)
  },
  hasPeople: function (name, args) {
    args = args || []
    idx = this.tgt.idxItemFromName(_(POPREFIX_PEOPLE + name, args))
    return (idx > -1)
  },
  removePeople: function (name, args) {
    args = args || []
    idx = this.tgt.idxItemFromName(_(POPREFIX_PEOPLE + name, args))
    return this.tgt.removeItemByIdx(idx)
  },
  getItemFromName: function (name) {
    idx = this.tgt.idxItemFromName(name)
    return ((idx == -1) ? null : this.tgt.items[idx])
  },
  getItem: function (name) {
    return this.tgt.getItemFromName(_('item_' + name))
  },
  // PO ready room and item definition
  newItemBatch: function (id, names, prop) {
    let ret = []
    prop = prop || {}
    for (let i = 0; i < names.length; i++) {
      prop.poid = id
      prop.id = id + names[i]
      prop.povars = [names[i]]
      ret[i] = new Item(prop)
      this.tgt.addItem(ret[i])
    }
    return ret
  },
  newItem: function (id, prop) {
    prop = prop || {}
    prop.id = prop.id || id
    prop.poid = prop.poid || id
    let ret = new Item(prop)
    this.tgt.addItem(ret)
    return ret
  },
  newPeople: function (id, prop) {
    prop = prop || {}
    prop.poid = prop.poid || id
    prop.id = prop.id || id
    let ret = new People(prop)
    this.tgt.addItem(ret)
    return ret
  },
  newLink: function (id, tgt, prop) {
    prop = prop || {}
    prop.poid = prop.poid || id
    prop.id = prop.id || id
    let ret = new Link(tgt, prop)
    if (tgt instanceof Room) {
      this.tgt.addDoor(ret)
    } else {
      this.tgt.addItem(ret)
    }
    return ret
  },
  newRoom: function (id, prop) {
    let ret = newRoom(id, prop)
    this.tgt.addDoor(ret)
    return ret
  },
  addRoom: function (id, prop) {
    this.tgt.addDoor(newRoom(id, prop))
    return this
  }
})
function newRoom (id, prop) {
  // this function automatically set the variable $id to ease game saving
  let poid = POPREFIX_ROOM + id
  prop = prop || {}
  prop.var = prop.var || ('$' + id) // currently undefined for user created rooms, see mkdir
  prop.poid = poid
  prop.id = id
  let n = new Room(prop)
  return n
}
