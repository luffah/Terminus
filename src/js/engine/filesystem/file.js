function genUID (name) {
  return name.substr(0, 4) + inc(genUID.cnt, name)
}
genUID.cnt = {}

function File (name, text, prop) {
  prop = prop || {}
  this.mod = new Modes(prop.mod || 'a+r')
  this.picture = new Pic(prop.picname, prop)
  this.owner = prop.owner || 'user'
  this.group = prop.group || 'user'
  this.cmd_event = {}
  this.cmd_hook = {}
  this.name = name
  this.room = null
  this.text = text
  this.tgt = prop.link || this
  this.link = prop.link
  this.uid = prop.uid || genUID(prop.poid || name)
  //  console.log(name,this.uid)
  this.poprefix = prop.poprefix
  EventTarget.call(this)
  this._inheritable = ['poprefix']
  this._clonable = ['_listeners', 'cmd_event', 'cmd_hook', 'text']
  this._copiable = ['picture']
  if (prop.states) {
    this.addStates(prop.states)
  }
  if (prop.events) this.setCmdEvents(prop.events)
  if (prop.hooks) {
    for (var i in prop.hooks) {
      if (prop.hooks.hasOwnProperty(i)) {
        this.setCmd(i, prop.hooks[i])
      }
    }
  }
  if (prop.poid) this.setPo(prop.poid, prop.povars)
  this.v = prop.v // contextual variable
  if (prop.var) {
    this.var = prop.var
    window[prop.var] = this
  }
}

File.prototype = union(EventTarget.prototype, {
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
  toString: function () { return this.name },
  getText: function () { return this.text },
  setText: function (text) {
    this.text = text
    return this
  },
  getName: function () { return this.name },
  setName: function (name) {
    this.name = name
    return this
  },
  getPic: function () { return this.picture },
  setPic: function (pic) {
    this.picture.set(pic)
  },
  ismod: function (right, ctx) {
    if (this.mod.get('o', right)) return true
    if (ctx) {
      return (
        (ctx.user.groups.indexOf(this.group) != -1 &&
          this.mod.get('g', right)) ||
      (ctx.currentuser == this.owner &&
          this.mod.get('u', right)))
    }
  },
  chmod: function (chmod) {
    this.mod.parse(chmod)
    return this
  },
  setPo: function (name, vars) {
    this.poid = this.poprefix + name
    this.povars = vars
    this.name = _(this.poid, vars)
    this.text = _(this.poid + POSUFFIX_DESC, vars)
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
  // addStates shall receive a dictionnary {} as argument, if you want to declare only one state use addState
  addStates: function (h) {
    if (h instanceof Object) {
      for (var i in h) {
        if (h.hasOwnProperty(i)) {
          this.addListener(i, this.apply)
          state.add(this.uid + i, h[i])
          this.cmd_event[i] = i
        }
      }
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
  },
  addPicMod: function (id, picname, prop) {
    this.picture.setChild(id, new Pic(picname, prop))
    return this
  },
  rmPicMod: function (id, picname) {
    this.picture.unsetChild(id)
    return this
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
  }
})

function Item (name, text, picname, prop) {
  prop = prop || {}
  prop.poprefix = prop.poprefix || POPREFIX_ITEM
  prop.picname = picname
  File.call(this, name, text || _(PO_DEFAULT_ITEM), prop)
  this._inheritable.push('room')
  if (prop.exec) {
    this.exec_function = prop.exec
  }
}
Item.prototype = union(File.prototype, {
  setExec: function (fu) {
    this.exec_function = fu
  },
  unsetExec: function () {
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
function People (name, text, picname, prop) {
  prop = prop || {}
  prop.poprefix = d(prop.poprefix, POPREFIX_PEOPLE)
  Item.call(this, name, text, picname, prop)
}
People.prototype = Item.prototype
