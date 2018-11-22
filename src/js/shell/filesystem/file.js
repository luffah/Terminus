function genUID (name) {
  return name.substr(0, 4) + inc(genUID.cnt, name)
}
genUID.cnt = {}

function File (prop) {
  EventTarget.call(this)
  this._inheritable = ['poprefix']
  this._clonable = ['_listeners', 'cmd_event', 'cmd_hook', 'text']
  this._copiable = ['img']
  this.cmd_event = {}
  this.cmd_hook = {}
  this.name = prop.name
  this.room = prop.room
  this.text = prop.text
  this.mod = new Modes()
  this.uid = genUID(prop.poid || name)
  this.set(inject(
    { mod: 'a+r',
      owner: (prop.room ? prop.room.owner : 'user'),
      group: (prop.room ? prop.room.group : 'user'),
      tgt: this,
      nopo: [],
      pic_shown_in_ls: true },
    prop))
}

File.prototype = union(EventTarget.prototype, {
  set: function (prop) {
    if (prop.group) this.group = prop.group
    if (prop.id) this.id = prop.id
    if (prop.link) this.link = prop.link
    if (prop.music) this.music = prop.music
    if (prop.owner) this.owner = prop.owner
    if (prop.img) this.picture = prop.img
    if (prop.poprefix) this.poprefix = prop.poprefix
    if (prop.name) this.name = prop.name
    if (prop.text) this.text = prop.text
    if (prop.tgt) this.tgt = prop.tgt
    if (prop.v) this.v = prop.v // contextual variable
    if (prop.mod) this.mod.parse(prop.mod)
    if (prop.states) this.addStates(prop.states)
    if (prop.events) this.setCmdEvents(prop.events)
    if (prop.syntax) this.syntax = syntax
    let h
    if (h = prop.hooks) {
      Object.keys(h).forEach((i) => {
        this.setHook(i, h[i])
      })
    }
    if (prop.nopo) this.nopo = prop.nopo
    if (!this.name &&
      this.nopo.indexOf('name') != -1) {
      this.name = prop.id
    }
    if (prop.poid) this.setPo(prop.poid, prop.povars)
    if (def(prop.cmd)) {
      if (prop.cmd == 0) {
        prop.cmd = prop.id
      }
      this.empower(prop.cmd)
    }
    if (def(prop.var)) {
      if (prop.var == 0) {
        prop.var = prop.id
      }
      this.var = prop.var
      window[prop.var] = this
    }
    return this
  },
  copy: function (name) {
    let nut = this.constructor(name)
    for (let attr in this._copiable) {
      if (this.hasOwnProperty(attr)) nut[attr] = obj[attr].copy()
    }
    for (let attr in this._clonable) {
      if (this.hasOwnProperty(attr)) nut[attr] = clone(obj[attr])
    }
    for (let attr in this._inheritable) {
      if (this.hasOwnProperty(attr)) nut[attr] = obj[attr]
    }
    return nut
  },
  stringify: function () { return this.tgt.var },
  is: function (a, b) { return a.tgt.uid === a.tgt.uid },
  getHash: function () {
    hash = {}
    hash['m'] = this.mod.stringify()
    hash['d'] = this.hasOwnProperty('children') * 1
    hash['events'] = this.cmd_event
    // hash['states']=this._listeners;
    // TODO: revoir définition d'une sauvegarde... + alteration d'état room/file dans gamestate ?
    // hash['states_']=state;
    hash['img'] = this.picture
    return hash
  },
  toString: function () { return this.name },
  getText: function () { return this.text },
  setText: function (text) { this.text = text; return this },
  getName: function () { return this.name },
  setName: function (name) { this.name = name; return this },
  setPic: function (pic) { this.img = pic },
  ismod: function (right, ctx) {
    // log(ctx, right, this.mod.modes)
    if (this.mod.get('o', right)) return true
    if (ctx) {
      return (
        (ctx.user.groups.indexOf(this.group) != -1 &&
          this.mod.get('g', right)) ||
        (ctx.me == this.owner &&
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
    if (this.nopo.indexOf('name') == -1) {
      this.name = _(this.poid, vars)
    }
    if (this.nopo.indexOf('text') == -1) {
      this.text = _(this.poid + POSUFFIX_DESC, vars)
    }
    return this
  },
  checkTextIdx: function (textidx) {
    return dialog.hasOwnProperty(this.poid + POSUFFIX_DESC + d(textidx,''))
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
    for (let i in h) {
      if (h.hasOwnProperty(i)) {
        this.cmd_event[i] = (h[i] || i)
      }
    }
    return this
  },
  setHook: function (cmd, fu) {
    if (typeof fu === 'object') {
      fu = () => { return { ret: fu } }
    } else if (typeof fu === 'string') {
      fu = () => { return { ret: _stdout(fu), pass: true } }
    }
    this.cmd_hook[cmd] = fu
    return this
  },
  unsetHook: function (cmd) {
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
    state.add(this.uid + name, fun, this, name)
    this.cmd_event[name] = name
    return this
  },
  // addStates shall receive a dictionnary {} as argument, if you want to declare only one state use addState
  addStates: function (h) {
    Object.keys(h).forEach((i) => {
      this.addState(i, h[i])
    })
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
  },
  fire_event: function (vt, cmd, args, idx, ct) {
    ct = ct || {}
    let ev_trigger = null
    let ctx = { arg: (def(idx) ? args[idx] : null), args: args, i: idx, ct: ct }
    if (ct.unreachable_room) {
      if ((ct.unreachable_room.name in globalSpec) && (cmd in globalSpec[ct.unreachable_room.name])) {
        ev_trigger = globalSpec[ct.unreachable_room.name][cmd]
      }
    } else if (cmd in this.tgt.cmd_event) {
      ev_trigger = this.tgt.cmd_event[cmd]
    }
    if (ev_trigger) {
      let ck = (typeof ev_trigger === 'function' ? ev_trigger(ctx, this, cmd) : ev_trigger)
      if (ck) {
        console.log(this.tgt.uid + ' FIRE ' + ck)
        this.tgt.fire(ck)
      }
    }
  },
  toPathStr: function (base) {
    if (!base) {
      return (this.room ? this.room.toPathStr() : '') + '/' + this.toString()
    }
  }
})

function Item (prop) {
  prop.poprefix = prop.poprefix || POPREFIX_ITEM
  File.call(this, prop)
  this._inheritable.push('room')
  if (prop.exec) this.exec = prop.exec
}
Item.prototype = union(File.prototype, {
  setExec: function (fu) {
    this.exec_function = fu
  },
  unsetExec: function () {
    this.exec_function = undefined
  },
  exec: function (args, room, vt) {
    let it = this
    this.fire_event(vt, 'exec', args)
    if (this.exec_function) {
      return this.exec_function(this, args, room, vt)
    } else {
      return cmd_done(vt, [[it, 0]], it.text, 'exec', args)
    }
  },
  disappear: function () {
    this.room.removeItemByName(this.name)
  },
  moveTo: function (room) {
    this.room.removeItemByName(this.name)
    room.addItem(this)
    return this
  },
  empower: function (cmd) {
    let c = Command.get(cmd)
    this.exec = c.exec
    this.syntax = c.syntax
  },
  getSyntax: function (args, idx) {
    if (!this.syntax) return false
    return idx > this.syntax.length ? this.syntax[-1][0] : this.syntax[idx][0]
  }
})
function People (prop) {
  prop.poprefix = prop.poprefix || POPREFIX_PEOPLE
  Item.call(this, prop)
}
People.prototype = Item.prototype
