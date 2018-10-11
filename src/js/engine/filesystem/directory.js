var globalSpec = {}

function Room (roomname, introtext, picname, prop) {
  prop = prop || {}
  prop.executable = d(prop.executable, true)
  File.call(this, d(roomname, _(PO_DEFAULT_ROOM, [])), picname, prop)
  this.parents = []
  this.previous = this
  this.children = []
  this.items = []
  this.isRoot = true
  this.commands_lock = {}
  this.intro_text = d(introtext, _(PO_DEFAULT_ROOM_DESC))
  this.starter_msg = null
  this.enter_callback = null
  this.leave_callback = null
  this.suggestions = []
}
function newRoom (id, picture, prop) {
  // this function automatically set the variable $id to ease game saving
  var poid = POPREFIX_ROOM + id
  var n = new Room(
    _(poid, [], { or: PO_DEFAULT_ROOM }),
    _(poid + POSUFFIX_DESC, [], { or: PO_DEFAULT_ROOM_DESC }),
    picture,
    prop)
  n.varname = '$' + id// currently undefined for user created rooms, see mkdir
  n.poid = poid
  n.picture.setImgClass(n.varname.replace('$', 'room-'))
  window[n.varname] = n
  return n
}
function enterRoom (new_room, vt) {
  var ctx = vt.getContext()
  var prev = ctx.room
  if (prev || !new_room.hasParent(prev)) {
    console.log(prev.toString(), 'doLeaveCallbackTo', new_room.toString())
    prev.doLeaveCallbackTo(new_room)
  }
  ctx.room = new_room
  state.setCurrentContext(ctx)
  if (typeof new_room.enter_callback === 'function') {
    new_room.enter_callback(new_room, vt)
  }
  // TODO : put this in a clean way // depends on background.js
  enter_room_effect()
  //
  return [new_room.toString(), new_room.intro_text]
}
Room.parse = function (str) {
  return window[str]
}
Room.prototype = union(File.prototype, {
  stringify: function () { return this.varname },
  fire_event: function (vt, cmd, args, idx, ct) {
    ct = d(ct, {})
    var ev_trigger = null
    console.log('EVENT ' + cmd)
    var context = { term: vt, room: this, arg: (def(idx) ? args[idx] : null), args: args, i: idx, ct: ct }
    if (ct.hasOwnProperty('unreachable_room')) {
      if ((ct.unreachable_room.name in globalSpec) && (cmd in globalSpec[ct.unreachable_room.name])) {
        ev_trigger = globalSpec[ct.unreachable_room.name][cmd]
      }
    } else if (cmd in this.cmd_event) {
      ev_trigger = this.cmd_event[cmd]
    }
    if (ev_trigger) {
      var ck = (typeof ev_trigger === 'function' ? ev_trigger(context) : ev_trigger)
      if (ck) {
        console.log(this.uid + ' FIRE ' + ck)
        this.fire(ck)
      }
    }
  },
  // text displayed at each change
  setIntroText: function (txt) {
    this.intro_text = txt
    return this
  },
  addCommand: function (cmd) {
    this.suggestions.push(cmd)
    return this
  },
  removeCommand: function (cmd) {
    rmIdxOf(this.suggestions, cmd)
  },
  checkTextIdx: function (textidx) {
    return dialog.hasOwnProperty(this.poid + POSUFFIX_DESC + textidx)
  },
  setTextIdx: function (textidx, vars) {
    this.intro_text = _(this.poid + POSUFFIX_DESC + textidx, vars, { or: this.poid + POSUFFIX_DESC })
    return this
  },
  // callback when entering in the room
  setEnterCallback: function (fu) {
    this.enter_callback = fu
    return this
  },
  setLeaveCallback: function (fu) {
    this.leave_callback = fu
    return this
  },
  // a message displayed on game start
  getStarterMsg: function (prefix) {
    prefix = prefix || ''
    if (this.starter_msg) {
      return prefix + this.starter_msg
    } else {
      return prefix + _(POPREFIX_CMD + 'pwd', [this.name]).concat('\n').concat(this.intro_text)
    }
  },
  setStarterMsg: function (txt) {
    this.starter_msg = txt
    return this
  },
  // Room picture
  // item & people management
  addItem: function (newitem) {
    pushDef(newitem, this.items)
    newitem.room = this
    return this
  },
  newItem: function (id, picname, prop) {
    prop = d(prop, {})
    prop.poid = d(prop.poid, id)
    var ret = new Item('', '', picname, prop)
    this.addItem(ret)
    return ret
  },
  newPeople: function (id, picname, prop) {
    prop = d(prop, {})
    prop.poid = d(prop.poid, id)
    var ret = new People('', '', picname, prop)
    this.addItem(ret)
    return ret
  },
  newItemBatch: function (id, names, picname, prop) {
    var ret = []
    prop = d(prop, {})
    for (var i = 0; i < names.length; i++) {
      prop.poid = id
      prop.povars = [names[i]]
      ret[i] = new Item('', '', picname, prop)
      this.addItem(ret[i])
    }
    return ret
  },
  removeItemByIdx: function (idx) {
    return ((idx == -1) ? null : this.items.splice(idx, 1)[0])
  },
  removeItemByName: function (name) {
    idx = this.idxItemFromName(name)
    return this.removeItemByIdx(idx)
  },
  hasItem: function (name, args) {
    args = args || []
    idx = this.idxItemFromName(_(POPREFIX_ITEM + name, args))
    return (idx > -1)
  },
  removeItem: function (name, args) {
    args = args || []
    idx = this.idxItemFromName(_(POPREFIX_ITEM + name, args))
    return this.removeItemByIdx(idx)
  },
  hasPeople: function (name, args) {
    args = args || []
    idx = this.idxItemFromName(_(POPREFIX_PEOPLE + name, args))
    return (idx > -1)
  },
  removePeople: function (name, args) {
    args = args || []
    idx = this.idxItemFromName(_(POPREFIX_PEOPLE + name, args))
    return this.removeItemByIdx(idx)
  },
  idxItemFromName: function (name) {
    return this.items.map(objToStr).indexOf(name)
  },
  idxChildFromName: function (name) {
    return this.children.map(objToStr).indexOf(name)
  },
  getItemFromName: function (name) {
    //    console.log(name);
    idx = this.idxItemFromName(name)
    return ((idx == -1) ? null : this.items[idx])
  },
  getItem: function (name) {
    return this.getItemFromName(_('item_' + name))
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
  addPath: function (newchild, wayback) {
    if (def(newchild) && !this.hasChild(newchild)) {
      this.children.push(newchild)
      if (d(wayback, true)) {
        newchild.parents.push(this)
        newchild.isRoot = false
      }
    }
    return this
  },
  doLeaveCallbackTo: function (to) {
    t = this
    if (t.uid === to.uid) {
    } else if (t.parents.length) {
      var p = t.parents[0]
      if (typeof t.leave_callback === 'function') {
        t.leave_callback()
      }
      if (p) {
        p.doLeaveCallbackTo(to)
      }
    }
  },
  doEnterCallbackTo: function (to) {
    t = this
    if (t.uid === to.uid) {
    } else if (t.children.length) {
      var p = t.parents[0]
      if (typeof t.leave_callback === 'function') {
        t.enter_callback()
      }
      if (p) {
        p.doEnterCallbackTo(to)
      }
    }
  },
  hasParent: function (par, symbolic) {
    symbolic = d(symbolic, false)
    var ret = false; var p = this.parents
    for (var i = 0; i < (symbolic ? p.length : (p.length ? 1 : 0)); i++) {
      ret = ((p[i].uid == par.uid) || ret) || p[i].hasParent(par)
    }
    return ret
  },
  removeParentPath: function (par) {
    rmIdxOf(this.parents, par)
  },
  removePath: function (child) {
    if (rmIdxOf(this.children, child)) {
      rmIdxOf(child.parents, this)
    }
  },
  destroy: function () {
    rmIdxOf(this.parents[0], this)
  },
  setOutsideEvt: function (name, fun) {
    globalSpec[this.name][name] = fun
    return this
  },
  unsetOutsideEvt: function (name) {
    delete globalSpec[this.name][name]
    return this
  },

  // command management
  setCommandOptions: function (cmd, options) {
    this.commands_lock[cmd] = options
    return this
  },
  removeCommandOptions: function (cmd) {
    delete this.commands_lock[cmd]
    return this
  },
  addCommand: function (cmd, options) {
    //    if (this.commands.indexOf(cmd) == -1) {
    //      this.commands.push(cmd);
    //    }
    if (def(options)) {
      this.setCommandOptions(cmd, options)
    }
    return this
  },

  /* Checks if arg can be reached from this room
   * Returns the room if it can
   * Returns false if it cannot
   *
   * 'arg' is a single node, not a path
   * i.e. $home.can_cd("next_room") returns true
   *      $home.can_cd("next_room/another_room") is invalid
   */
  can_cd: function (arg) {
    // Don't allow for undefined or multiple paths
    if (arg === '~') {
      return $home
    } else if (arg === '..') {
      return this.parents[0]
    } else if (arg === '.') {
      return this
    } else if (arg && arg.indexOf('/') == -1) {
      var c = this.children
      for (var i = 0; i < c.length; i++) {
        if (arg === c[i].toString()) {
          return c[i]
        }
      }
    }
    return null
  },

  /* Returns the room and the item corresponding to the path
   * if item is null, then the path describe a room and  room is the full path
   * else room is the room containing the item */
  traversee: function (path) {
    var item; var pa = this.pathToRoom(path); var ret = {}
    ret.room = pa[0]; ret.item_name = pa[1]; ret.item_idx = -1
    if (ret.room) {
      ret.room_name = ret.room.name
      if (ret.item_name) {
        for (i = 0; i < ret.room.items.length; i++) {
          if (ret.item_name === ret.room.items[i].toString()) {
            ret.item = ret.room.items[i]
            ret.item_idx = i
            break
          }
        }
      }
    }
    console.log(ret)
    return ret
  },
  pathToRoom: function (path) {
    var pat = path.split('/')
    var room = this
    var lastcomponent = null
    var cancd = true
    var pathstr = ''
    for (var i = 0; i < pat.length - 1; i++) {
      if (room && room.executable) {
        room = room.can_cd(pat[i])
        if (room) {
          pathstr += (i > 0 ? '/' : '') + pat[i]
        }
      } else {
        break
      }
    }
    if (room) {
      lastcomponent = pat[pat.length - 1]
      cancd = room.can_cd(lastcomponent)
      if (cancd) {
        room = cancd
        pathstr += (i > 0 ? '/' : '') + lastcomponent + '/'
        lastcomponent = null
      }
    }
    return [room, lastcomponent, pathstr]
  }

})
