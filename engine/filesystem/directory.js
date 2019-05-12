var POPREFIX_CMD = 'cmd_'
var POPREFIX_ROOM = 'room_'
var POPREFIX_ITEM = 'item_'
var POPREFIX_LINK = 'link'
var POPREFIX_ROOMLINK = 'link'
var POPREFIX_PEOPLE = 'people_'
var POSUFFIX_DESC = '_text'
// var PO_NONE = 'none'
// var PO_NONE_DESC = PO_NONE + POSUFFIX_DESC
// var PO_DEFAULT_ROOM = POPREFIX_ROOM + PO_NONE
// var PO_DEFAULT_ITEM = POPREFIX_ITEM + PO_NONE
// var PO_DEFAULT_LINK = POPREFIX_LINK
// var PO_DEFAULT_ROOMLINK = POPREFIX_ROOMLINK
// var PO_DEFAULT_PEOPLE = POPREFIX_PEOPLE + PO_NONE
// var PO_DEFAULT_ROOM_DESC = POPREFIX_ROOM + PO_NONE_DESC
// var PO_DEFAULT_ITEM_DESC = POPREFIX_ITEM + PO_NONE_DESC
// var PO_DEFAULT_PEOPLE_DESC = POPREFIX_PEOPLE + PO_NONE_DESC
var globalSpec = {}

class Room extends File {
  constructor (prop) {
    prop = inject({ mod: 755 }, prop)
    prop.poprefix = prop.poprefix || POPREFIX_ROOM
    // console.log('room ' + prop.id, prop.var)
    super(prop)
    this.effects = { key: {} }
    // name || _(PO_DEFAULT_ROOM),
    // text || _(PO_DEFAULT_ROOM_DESC),
  }
  set (prop) {
    super.set(prop)
    if (!this.items) this.items = []
    if (!this.children) this.children = []
    if (prop.starterMsg) this.starter_msg = prop.starterMsg
    if (prop.lost) this.lost = prop.lost
    if (prop.enterCallback) this._enterCallback = prop.enterCallback
    if (prop.leaveCallback) this._leaveCallback = prop.leaveCallback
    if (prop.pic_shown_as_item) this.pic_shown_as_item = prop.pic_shown_as_item
    let h = prop.items
    if (h) {
      Object.keys(h).forEach((i) => {
        let m = i.match(re.batch)
        if (m) this.newItemBatch(m[1], m[2].split(','), h[i])
        else this.newItem(i, h[i])
      })
    }
    h = prop.peoples
    if (h) {
      Object.keys(h).forEach((i) => {
        this.newPeople(i, h[i])
      })
    }
    h = prop.children
    if (h) {
      Object.keys(h).forEach((i) => {
        this.newRoom(i, h[i])
      })
    }
    h = prop.tree
    if (h) {
      Object.keys(h).forEach((i) => {
        this.newRoom(i, h[i])
      })
    }
    return this
  }
  isRoot () { return !this.room }
  getDoors () { return this.tgt.children }
  getItems () { return this.tgt.items.filter((o) => !(o instanceof People)) }
  getPeoples () { return this.tgt.items.filter((o) => (o instanceof People)) }
  // a message displayed on game start
  set starterMsg (txt) { this.tgt.starter_msg = txt; return this.tgt }
  get starterMsg () {
    if (this.tgt.starter_msg) {
      return this.tgt.starter_msg
    } else {
      return _(POPREFIX_CMD + 'pwd', [this.tgt.name]).concat('\n').concat(this.tgt.text)
    }
  }
  // sub room management
  getChildFromName (name) {
    return this.children.find(c => c.name === name)
  }
  hasChild (child) { return this.getChildFromName(child.name) }
  addDoor (f, wayback=true) {
    if (f) {
      let i = 0
      let name = f.name
      while (this.children.find(c => c.name === f.name)) {
        f.name = name + '.' + (++i)
      }
      this.children.push(f)
      if (wayback) {
        f.room = this.tgt
      }
    }
    return this.tgt
  }
  removeDoor (child) { if (pick(this.children, child.uid, 'uid')) { child.room = null } }
  destroy () { pick(this.room.children, this.uid, 'uid'); this.room = null }
  getRoot () { return (this.tgt.room ? this.tgt.room.getRoot() : this.tgt) }
  getDir (arg, ctx) {
  /* Get a reachable room from current room
   * non recursive i.e. for rooms r/r2/r3
   * r.getDir("r2",c) returns r2
   * r.getDir("r2/r3",c) returns null
   */
    let r = null

    if (arg === '~') {
      r = ctx.h.v.HOME || ctx.h.r.getRoot()
    } else if (arg === '..') {
      r = this.room
    } else if (arg === '.') {
      r = this
    } else if (arg && !arg.includes('/')) {
      r = this.tgt.children.find((i) => arg === i.toString())
    }
    return r || null
  }
  // callback when entering in the room
  setLeaveCallback (fu) { this.tgt._leaveCallback = fu; return this }
  doLeaveCallbackTo (to) {
    let r = this
    // console.log(r.toString(), 'doLeaveCallbackTo', to.toString())
    if (r.uid !== to.uid && r.room) {
      if (typeof r._leaveCallback === 'function') {
        r._leaveCallback()
      }
      r.room.doLeaveCallbackTo(to)
    }
  }
  setEnterCallback (fu) { this.tgt._enterCallback = fu; return this }
  doEnterCallbackTo (to) {
    let r = this
    if (r.uid === to.uid) {
    } else if (r.children.length) {
      if (typeof r._leaveCallback === 'function') {
        r._enterCallback()
      }
      if (r.room) {
        r.room.doEnterCallbackTo(to)
      }
    }
  }
  isParentOf (par) { return par.room && (par.room.uid === this.uid || this.isParentOf(par.room)) }
  setOutsideEvt (name, fun) { globalSpec[this.name][name] = fun; return this }
  unsetOutsideEvt (name) { delete globalSpec[this.name][name]; return this }
  isEmpty () { return (this.tgt.children.length === 0 && this.tgt.items.length === 0) }
  /* Returns the room and the item corresponding to the path
   * if item is null, then the path describe a room and  room is the full path
   * else room is the room containing the item */
  traversee (path, ctx) {
    let [room, lastcomponent] = this.pathToRoom(path, ctx)
    let ret = { room: room, item_name: lastcomponent, item_idx: -1 }
    if (room) {
      ret.room_name = room.name
      if (lastcomponent) {
        ret.item = ret.room.tgt.items.find((it, i) =>
          lastcomponent === it.toString() && (ret.item_idx = i) + 1)
      }
    }
    return ret
  }
  checkAccess (ctx) {
    let c = ctx.h.r.tgt
    let r = this.tgt
    if (c.uid === r.uid) {
      return true
    } else if (r.isParentOf(c)) {
      return r.ismod('x', ctx)
    } else if (c.isParentOf(r)) {
      return r.ismod('x', ctx) && r.room.checkAccess(ctx)
    } else {
      return r.ismod('x', ctx) && (!r.room || r.room.checkAccess(ctx))
    }
  }
  pathToRoom (path, ctx) {
    // returns [ room associated to the path,
    //           non room part of path,
    //           valid path ]
    if (path !== '/') path = path.replace(/\/$/, '')
    let room = this.tgt
    let pat = path.split('/')
    let end = pat.slice(0, -1).findIndex((r) => !(room = room.getDir(r, ctx)))
    let pathstr = pat.slice(0, end).join('/')
    let lastcomponent = null
    let cancd
    if (room) {
      lastcomponent = pat.pop() || null
      cancd = room.getDir(lastcomponent, ctx)
      if (cancd) {
        room = cancd
        pathstr += (end <= 0 ? '' : '/') + lastcomponent + '/'
        lastcomponent = null
      }
    }
    return [room, lastcomponent, pathstr]
  }
  // item & people management
  addItem (f) {
    if (f) {
      let i = 0
      let name = f.name
      while (this.tgt.items.find(it => it.name === f.name)) {
        f.name = name + '.' + (++i)
      }
      this.tgt.items.push(f)
      f.room = this.tgt
    }
    return this.tgt
  }
  removeItemByIdx (idx) {
    return pop(this.tgt.items, idx)
  }
  removeItemByName (name) {
    return pick(this.tgt.items, name, 'name')
  }
  hasItem (name, args, prefix) {
    let n = _((prefix || POPREFIX_ITEM) + name, args || [])
    return this.tgt.items.find(i => i.name === n)
  }
  removeItem (name, args, prefix) {
    return this.tgt.removeItemByName(_((prefix || POPREFIX_ITEM) + name, args || []))
  }
  hasPeople (name, args) {
    return this.tgt.hasItem(name, args, POPREFIX_PEOPLE)
  }
  removePeople (name, args) {
    return this.tgt.removeItem(name, args, POPREFIX_PEOPLE)
  }
  getItemFromName (name) {
    return this.tgt.items.find(i => i.name === name)
  }
  // PO ready room and item definition
  newItemBatch (id, names, prop) {
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
  }
  newItem (id, prop) {
    let ret = new Item(inject({ poid: id, id: id }, prop))
    this.tgt.addItem(ret)
    return ret
  }
  newPeople (id, prop) {
    let ret = new People(inject({ poid: id, id: id }, prop))
    this.tgt.addItem(ret)
    return ret
  }
  newLink (id, prop) {
    if (!prop.tgt) return undefined
    let ret = new Link(inject({ poid: id, id: id }, prop))
    if (prop.tgt instanceof Room) {
      this.tgt.addDoor(ret)
    } else {
      this.tgt.addItem(ret)
    }
    return ret
  }
  newRoom (id, prop) {
    let ret = newRoom(id, prop)
    this.tgt.addDoor(ret)
    return ret
  }
  addRoom (id, prop) {
    this.tgt.addDoor(newRoom(id, prop))
    return this
  }

  static enter (r, vt) {
    let ctx = vt.ctx
    // console.log('enterRoom', r, ctx)
    let prev = ctx.h.r
    if (prev && !prev.isParentOf(r)) {
      prev.doLeaveCallbackTo(r)
    }
    ctx.h.r = r
    if (!r.lost) {
      state.saveContext(ctx)
    }
    if (r.music) {
      vt.playMusic(r.music, { loop: true })
    }
    if (typeof r._enterCallback === 'function') {
      r._enterCallback(r, vt)
    }
    if (typeof r.effects.enter_room === 'function') {
      r.effects.enter_room(r, vt)
    } else if (typeof vt.effects.enter_room === 'function') {
      vt.effects.enter_room(r, vt)
    }
    return [r.toString(), r.text]
  }
}
function newRoom (id, prop) {
  // this function automatically set the variable $id to ease game saving
  return new Room(inject({ poid: id, id: id, var: ('$' + id) }, prop))
}