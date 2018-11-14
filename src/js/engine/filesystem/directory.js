var globalSpec = {}

function Room (name, text, prop) {
  console.log('room ' + name, prop.var)
  prop = prop || {}
  console.log('room ' + name, prop.var)
  if (!prop.mod) { prop.mod = 755 }
  File.call(this,
    name || _(PO_DEFAULT_ROOM),
    text || _(PO_DEFAULT_ROOM_DESC),
    prop)
  this.children = []
  this.items = []
  this.starter_msg = prop.starterMsg || null
  this.enter_callback = prop.enterCallback || null
  this.leave_callback = prop.leaveCallback || null
  this._last_to = this
}
function newRoom (id, picname, prop) {
  // this function automatically set the variable $id to ease game saving
  var poid = POPREFIX_ROOM + id
  prop = prop || {}
  prop.var = prop.var || ('$' + id) // currently undefined for user created rooms, see mkdir
  prop.picname = picname
  console.log('Room ' + id, prop.var)
  var n = new Room(
    _(poid, [], { or: PO_DEFAULT_ROOM }),
    _(poid + POSUFFIX_DESC, [], { or: PO_DEFAULT_ROOM_DESC }),
    prop)
  n.poid = poid
  n.id = id
  n.picture.setImgClass('room-' + id)
  return n
}
function enterRoom (new_room, vt) {
  var ctx = vt.getContext()
  console.log('enterRoom', new_room, ctx)
  var prev = ctx.room
  if (prev && !prev.isParentOf(new_room)) {
    prev.doLeaveCallbackTo(new_room)
  }
  ctx.room = new_room
  state.setCurrentContext(ctx)
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
  stringify: function () { return this.tgt.var },
  fire_event: function (vt, cmd, args, idx, ct) {
    ct = d(ct, {})
    var ev_trigger = null
    console.log('EVENT ' + cmd)
    var context = { term: vt, room: this, arg: (def(idx) ? args[idx] : null), args: args, i: idx, ct: ct }
    if (ct.unreachable_room) {
      if ((ct.unreachable_room.name in globalSpec) && (cmd in globalSpec[ct.unreachable_room.name])) {
        ev_trigger = globalSpec[ct.unreachable_room.name][cmd]
      }
    } else if (cmd in this.tgt.cmd_event) {
      ev_trigger = this.tgt.cmd_event[cmd]
    }
    if (ev_trigger) {
      var ck = (typeof ev_trigger === 'function' ? ev_trigger(context) : ev_trigger)
      if (ck) {
        console.log(this.tgt.uid + ' FIRE ' + ck)
        this.tgt.fire(ck)
      }
    }
  },
  isRoot: function(){ return !this.room },
  getDoors: function() { return this.tgt.children },
  getItems: function() {
    return this.tgt.items.filter((o) => !(o instanceof People))
  },
  getPeoples: function() {
     return this.tgt.items.filter((o) => (o instanceof People))
  },
  addCommand: function (cmd, options) {
    if (def(options)) {
      this.tgt.setCommandOptions(cmd, options)
    }
    return this.tgt
  },
  // callback when entering in the room
  setEnterCallback: function (fu) {
    this.tgt.enter_callback = fu
    return this
  },
  setLeaveCallback: function (fu) {
    this.tgt.leave_callback = fu
    return this
  },
  // a message displayed on game start
  getStarterMsg: function (prefix) {
    prefix = prefix || ''
    if (this.tgt.starter_msg) {
      return prefix + this.tgt.starter_msg
    } else {
      return prefix + _(POPREFIX_CMD + 'pwd', [this.tgt.name]).concat('\n').concat(this.tgt.text)
    }
  },
  setStarterMsg: function (txt) {
    this.tgt.starter_msg = txt
    return this.tgt
  },
  // Room picture
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
  removeItemByIdx: function (idx) {
    return ((idx == -1) ? null : this.tgt.items.splice(idx, 1)[0])
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
  idxItemFromName: function (name) {
    return this.tgt.items.map(objToStr).indexOf(name)
  },
  idxChildFromName: function (name) {
    return this.tgt.children.map(objToStr).indexOf(name)
  },
  getItemFromName: function (name) {
    //    console.log(name);
    idx = this.tgt.idxItemFromName(name)
    return ((idx == -1) ? null : this.tgt.items[idx])
  },
  getItem: function (name) {
    return this.tgt.getItemFromName(_('item_' + name))
  },
  getDir: function (arg, ctx) {
    let r = null
    if (arg === '~') {
      r = $home
    } else if (arg === '..') {
      r = this.room
    } else if (arg === '.') {
      r = this
    } else if (arg && arg.indexOf('/') == -1) {
      r = this.tgt.children.filter((i) => arg == i.toString()).shift()
    }
    return (r) || null
  },

  // linked room management
  getChildFromName: function (name) {
    idx = this.children.map(objToStr).indexOf(name)
    return ((idx == -1) ? null : this.children[idx])
  },
  hasChild: function (child) {
    idx = this.children.map(objToStr).indexOf(child.name)
    return ((idx == -1) ? null : this.children[idx])
  },
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
  isParentOf: function (par) {
    return par.room && (par.room.uid == this.uid || this.isParentOf(par.room))
  },
  removePath: function (child) {
    if (rmIdxOf(this.children, child)) {
      child.room = null
    }
  },
  destroy: function () {
    rmIdxOf(this.room.children, this)
    this.room = null
  },
  setOutsideEvt: function (name, fun) {
    globalSpec[this.name][name] = fun
    return this
  },
  unsetOutsideEvt: function (name) {
    delete globalSpec[this.name][name]
    return this
  },
  isEmpty: function () {
    return (this.tgt.children.length === 0 &&
                  this.tgt.items.length === 0) },
  /* Returns the room and the item corresponding to the path
   * if item is null, then the path describe a room and  room is the full path
   * else room is the room containing the item */
  traversee: function (path) {
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
    let c = ctx.room.tgt
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
    var room = this.tgt
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
  newItemBatch: function (id, names, picname, prop) {
    var ret = []
    prop = d(prop, {})
    for (var i = 0; i < names.length; i++) {
      prop.poid = id
      prop.povars = [names[i]]
      ret[i] = new Item('', '', picname, prop)
      ret.id = id + i
      this.tgt.addItem(ret[i])
    }
    return ret
  },
  newItem: function (id, picname, prop) {
    prop = d(prop, {})
    prop.poid = d(prop.poid, id)
    var ret = new Item('', '', picname, prop)
    ret.id = id
    this.tgt.addItem(ret)
    return ret
  },
  newPeople: function (id, picname, prop) {
    prop = d(prop, {})
    prop.poid = d(prop.poid, id)
    var ret = new People('', '', picname, prop)
    ret.id = id
    this.tgt.addItem(ret)
    return ret
  },
  newRoom: function (id, picname, prop) {
    var ret = newRoom(id, picname, prop)
    this.tgt.addDoor(ret)
    return ret
  },
  concatNew: function (id, picname, prop) {
    var ret = newRoom(id, picname, prop)
    this.tgt._last_to.addDoor(ret)
    this.tgt._last_to = ret
    return this.tgt
  },
  newLink: function (id, tgt, picname, prop) {
    prop = d(prop, {})
    prop.poid = d(prop.poid, id)
    let ret = new Link('', tgt, '', picname, prop)
    if (tgt instanceof Room) {
      this.tgt.addDoor(ret)
    } else {
      this.tgt.addItem(ret)
    }
    ret.id = id
    return ret
  },
  concatLink: function (id, tgt, picname, prop) {
    let ret = this.tgt.newLink(id, tgt, picname, prop)
    if (tgt instanceof Room) {
      ret = new RoomLink(id, tgt, picname, prop)
      this.tgt._last_to.addDoor(ret)
      this.tgt._last_to = tgt
    } else {
      ret = new Link(id, tgt, picname, prop)
      this.tgt._last_to.addItem(ret)
    }
    return this.tgt
  },
  initConcat: function () {
    this._last_to = this.tgt
    return this.tgt
  },
  addItemOnQueue: function (id, picname, prop) {
    prop = d(prop, {})
    prop.poid = d(prop.poid, id)
    this.tgt._last_to.addItem(new Item('', '', picname, prop))
    return this.tgt
  },
  addItemBatchOnQueue: function (id, names, picname, prop) {
    prop = d(prop, {})
    prop.poid = id
    for (let i = 0; i < names.length; i++) {
      prop.povars = [names[i]]
      this.tgt._last_to.addItem(new Item('', '', picname, prop))
    }
    return this.tgt
  },
  addPeopleOnQueue: function (id, picname, prop) {
    prop = d(prop, {})
    prop.poid = d(prop.poid, id)
    this.tgt._last_to.addItem(new People('', '', picname, prop))
    return this.tgt
  }

})
