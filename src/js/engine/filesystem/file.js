function genUID (name) {
  inc(genUID.cnt, name)
  return name.substr(0, 4) + genUID.cnt[name]
}
genUID.cnt = {}

function File (name, picname, prop) {
  prop = prop || {}
  this.mod = new Modes(prop.mod || 'a+r')
  this.picture = new Pic(picname, prop)
  this.owner = prop.owner || 'user'
  this.group = prop.group || 'user'
  this.cmd_event = {}
  this.cmd_hook = {}
  this.name = name
  this.room = null
  this.text = ''
  this.uid = prop.uid || genUID(prop.poid || name)
  //  console.log(name,this.uid)
  this.poprefix = prop.poprefix
  EventTarget.call(this)
  this._inheritable = ['poprefix']
  this._clonable = ['_listeners', 'cmd_event', 'cmd_hook', 'text']
  this._copiable = ['picture']
}

File.prototype = union(EventTarget.prototype, {
  toString: function () {
    return this.name
  },
  getHash: function () {
    hash = {}
    hash['m'] = this.mod.stringify()
    hash['d'] = this.hasOwnProperty('children') * 1
    hash['events'] = this.cmd_event
    // hash['states']=this._listeners;
    // TODO: revoir définition d'une sauvegarde... + alteration d'état room/file dans gamestate ?
    // hash['states_']=state;
    hash['picture'] = this.picture.src
    return hash
  },
  ismod: function (right, ctx) {
    if (this.mod.get('o', right)) {
      return true
    }
    if (ctx) {
      if (ctx.user.groups.indexOf(this.group) != -1) {
        if (this.mod.get('g', right)) {
          return true
        }
      }
      if (ctx.currentuser == this.owner) {
        if (this.mod.get('u', right)) {
          return true
        }
      }
    }
    return false
  },
  setBranch(nu){
    this.branch_ref = nu || true
    return this
  },
  unsetBranch(){
    this.branch_ref = undefined
    return this
  },
  backBranch(nu){
    let branch_ref = nu || true
    if (this.room) {
      if (this.room.branch_ref || branch_ref == this.room.branch_ref){
        return this.room
      } else {
        return this.room.backBranch(branch_ref)
      }
    }
    return this
  },
  chmod: function (chmod) {
    this.mod.parse(chmod)
    return this
  },
  getName: function () {
    return this.name
  },
  setName: function (name) {
    this.name = name
    return this
  },
  getPic: function () {
    return this.picture
  },
  setPic: function (pic) {
    this.picture.set(pic)
  },
  setPo: function (name, vars) {
    this.poid = this.poprefix + name
    this.povars = vars
    this.name = _(this.poid, vars)
    this.text = _(this.poid + POSUFFIX_DESC, vars)
    return this
  },
  setText: function (text) {
    this.text = text
    return this
  },
  checkTextIdx: function (textidx) {
    return dialog.hasOwnProperty(this.poid + POSUFFIX_DESC + textidx)
  },
  setTextIdx: function (textidx, vars) {
    this.text = _(this.poid + POSUFFIX_DESC + textidx, vars, { or: this.poid + POSUFFIX_DESC })
    return this
  },
  unsetCmdEvent: function (cmd) {
    delete this.cmd_event[cmd]
    return this
  },
  setCmdEvent: function (cmd, fun) {
    this.cmd_event[cmd] = fun || cmd
    return this
  },
  setCmdEvents: function (h) {
    for (var i in h) {
      if (h.hasOwnProperty(i)) {
        this.setCmdEvent(i, h[i])
      }
    }
    return this
  },
  setCmd: function (cmd, fu) {
    if (typeof fu === 'object') {
      fu = () => { return { ret: fu } }
    } else if (typeof fu === 'string') {
      fu = () => { return { ret: _stdout(fu), pass: true } }
    }
    this.cmd_hook[cmd] = fu
    return this
  },
  unsetCmd: function (cmd) {
    delete this.cmd_hook[cmd]
    return this
  },
  apply: function (e) {
    if (typeof e === 'string') {
      name = e
      target = this
    } else {
      name = e.type
      target = e.target
    }
    state.apply(target.uid + name)
  },
  addState: function (name, fun) {
    this.addListener(name, this.apply)
    state.add(this.uid + name, fun)
    this.cmd_event[name] = name
    return this
  },
  addStates: function (h) {
    if (h instanceof Object) {
      for (var i in h) {
        if (h.hasOwnProperty(i)) {
          this.addListener(i, this.apply)
          state.add(this.uid + i, h[i])
          this.cmd_event[i] = i
        }
      }
    } else {
      console.error('addStates shall receive a dictionnary {} as argument, if you want to declare only one state use addState')
    }
    return this
  },
  copy: function (name) {
    var nut = this.constructor(name)
    for (var attr in this._copiable) {
      if (this.hasOwnProperty(attr)) nut[attr] = obj[attr].copy()
    }
    for (var attr in this._clonable) {
      if (this.hasOwnProperty(attr)) nut[attr] = clone(obj[attr])
    }
    for (var attr in this._inheritable) {
      if (this.hasOwnProperty(attr)) nut[attr] = obj[attr]
    }
    return nut
  }
})

function Item (name, intro, picname, prop) {
  prop = prop || {}
  prop.poprefix = d(prop.poprefix, POPREFIX_ITEM)
  File.call(this, name, picname, prop)
  this._inheritable.push('room')
  this.text = intro || _(PO_DEFAULT_ITEM)
  if (prop.poid) {
    this.setPo(prop.poid, prop.povars)
  }
}
Item.prototype = union(File.prototype, {
  addPicMod: function (id, picname, prop) {
    var newpic = new Pic(picname, prop)
    this.picture.setChild(id, newpic)
    return this
  },
  rmPicMod: function (id, picname) {
    this.picture.unsetChild(id, newpic)
    return this
  },
  setExecFunction: function (fu) {
    this.exec_function = fu
  },
  unsetExecFunction: function () {
    this.exec_function = undefined
  },
  exec: function (args, room, vt) {
    var it = this
    this.fire_event(vt, 'exec', args)
    if (this.exec_function) {
      return this.exec_function(this, args, room, vt)
    } else {
      return cmd_done(vt, [[it, 0]], it.text, 'exec', args)
    }
  },
  setPoDelta: function (delta) {
    if (typeof delta === 'string') {
      this.poid += delta
    } else {
      this.povars = delta
    }
    this.name = _(this.poid, this.povars)
    this.text = _(this.poid + POSUFFIX_DESC, this.povars)
    return this
  },
  fire_event: function (vt, cmd, args, idx) {
    var ev_trigger = null
    var context = { term: vt, room: this.room, item: this, arg: (def(idx) ? args[idx] : null), args: args, i: idx }
    if (cmd in this.cmd_event) {
      console.log(this.uid + ' EVENT ' + cmd)
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
  disappear: function () {
    this.room.removeItemByName(this.name)
  },
  moveTo: function (room) {
    this.room.removeItemByName(this.name)
    room.addItem(this)
    return this
  }
})
function People (name, intro, picname, prop) {
  // Inherit instance properties
  prop = prop || {}
  prop.poprefix = d(prop.poprefix, POPREFIX_PEOPLE)
  Item.call(this, name, intro, picname, prop)
}
People.prototype = Item.prototype
