function genUID (name) {
  return name.substr(0, 4) + inc(genUID.cnt, name)
}
genUID.cnt = {}

class File extends EventTarget {
  constructor(prop) {
    super()
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

  set(prop) {
    if (prop.id) this.id = prop.id
    if (prop.music) this.music = prop.music
    if (prop.img) this.img = prop.img
    if (prop.poprefix) this.poprefix = prop.poprefix
    if (prop.name) this.name = prop.name
    if (prop.text) this.text = prop.text
    if (prop.textIdx) this.textIdx = prop.textIdx
    if (prop.tgt) this.tgt = prop.tgt
    if (prop.mod) this.chmod(prop.mod)
    if (prop.pic_shown_in_ls) this.pic_shown_in_ls = prop.pic_shown_in_ls
    if (prop.states) this.addStates(prop.states)
    if (prop.events) this.setCmdEvents(prop.events)
    if (prop.syntax) this.syntax = syntax
    if (def(prop.group)) this.group = prop.group || prop.id
    if (def(prop.owner)) this.owner = prop.owner || prop.id
    if (prop.nopo) this.nopo = prop.nopo
    if (!this.name &&
      this.nopo.indexOf('name') != -1) {
      this.name = prop.id
    }
    if (prop.poid) this.setPo(prop.poid, prop.povars)
    if (def(prop.cmd)) this.empower(prop.cmd || prop.id)
    if (def(prop.v)) this.v = prop.v // contextual variable
    if (def(prop.var)) {
      this.var = prop.var || prop.id
      window[this.var] = this
    }
    let h
    if (h = prop.hooks) {
      Object.keys(h).forEach((i) => {
        this.setHook(i, h[i] || _(prop.poid + '_' + i))
      })
    }
    return this
  }

  copy(name) {
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
  }

  stringify() { return this.tgt.var }

  static parse(str) {
    return window[str]
  }

  is(a, b) { return a.tgt.uid === a.tgt.uid }

  getHash() {
    hash = {}
    hash['m'] = this.mod.stringify()
    hash['d'] = this.hasOwnProperty('children') * 1
    hash['events'] = this.cmd_event
    // hash['states']=this._listeners;
    // TODO: revoir définition d'une sauvegarde... + alteration d'état room/file dans gamestate ?
    // hash['states_']=state;
    hash['img'] = this.img
    return hash
  }

  toString() { return this.name }

  ismod(right, ctx) {
    if (this.mod.get('o', right)) return true
    if (ctx) {
      return (
        (ctx.user.groups.indexOf(this.group) != -1 &&
          this.mod.get('g', right)) ||
        (ctx.me == this.owner &&
          this.mod.get('u', right)))
    }
  }

  chmod(s) { this.mod.parse(s) }

  setPo(name, vars) {
    this.poid = this.poprefix + name
    this.povars = vars
    if (this.nopo.indexOf('name') == -1) {
      this.name = _(this.poid, vars)
    }
    if (this.nopo.indexOf('text') == -1) {
      this.text = _(this.poid + POSUFFIX_DESC, vars)
    }
    return this
  }

  checkTextIdx(textidx) {
    return dialog.hasOwnProperty(this.poid + POSUFFIX_DESC + d(textidx,''))
  }

  set textIdx(textidx) {
    this.text = _(this.poid + POSUFFIX_DESC + textidx, this.povars, { or: this.poid + POSUFFIX_DESC })
  }

  unsetCmdEvent(cmd) {
    delete this.cmd_event[cmd]
    return this
  }

  setCmdEvent(cmd, fun) {
    this.cmd_event[cmd] = fun || cmd
    return this
  }

  setCmdEvents(h) {
    for (let i in h) {
      if (h.hasOwnProperty(i)) {
        this.cmd_event[i] = (h[i] || i)
      }
    }
    return this
  }

  setHook(cmd, fu) {
    if (typeof fu === 'object') {
      fu = () => { return { ret: fu } }
    } else if (typeof fu === 'string') {
      fu = () => { return { ret: _stdout(fu), pass: true } }
    }
    this.cmd_hook[cmd] = fu
    return this
  }

  unsetHook(cmd) {
    delete this.cmd_hook[cmd]
    return this
  }

  tryhook(cmd, args){
    let f = this.cmd_hook[cmd]
    if (f) { 
      let ret = f(this, args)
      if (def(ret.ret)) return ret
      return {ret: ret, pass:d(ret.pass, 1)}
    }
  }

  apply(e) {
    let name, target
    if (typeof e === 'string') {
      name = e
      target = this
    } else {
      name = e.type
      target = e.target
    }
    state.apply(target.uid + name)
  }

  addState (name, fun) {
    this.addListener(name, this.apply)
    state.add(this.uid + name, fun, this, name)
    this.cmd_event[name] = name
    return this
  }

  // addStates shall receive a dictionnary {} as argument, if you want to declare only one state use addState
  addStates(h) {
    Object.keys(h).forEach((i) => {
      this.addState(i, h[i])
    })
    return this
  }

  set poDelta(delta) {
    if (typeof delta === 'string') {
      this.poid += delta
    } else {
      this.povars = delta
    }
    this.name = _(this.poid, this.povars)
    this.text = _(this.poid + POSUFFIX_DESC, this.povars)
  }

  fire_event(vt, cmd, args, idx, ct) {
    ct = ct || {}
    let f = this.tgt
    let ev_trigger = null
    let ctx = { arg: (def(idx) ? args[idx] : null), args: args, i: idx, ct: ct }
    if (ct.unreachable_room) {
      if ((ct.unreachable_room.name in globalSpec) && (cmd in globalSpec[ct.unreachable_room.name])) {
        ev_trigger = globalSpec[ct.unreachable_room.name][cmd]
      }
    } else if (cmd in f.cmd_event) {
      ev_trigger = f.cmd_event[cmd]
    }
    if (ev_trigger) {
      let ck = (typeof ev_trigger === 'function' ? ev_trigger(ctx, this, cmd) : ev_trigger)
      if (ck) {
        // console.log(f.uid + ' FIRE ' + ck)
        f.fire(ck)
      }
    }
  }

  toPathStr(base) {
    if (!base) {
      return (this.room ? this.room.toPathStr() : '') + '/' + this.toString()
    }
  }
}

class Item extends File {
  constructor(prop) {
    prop.poprefix = prop.poprefix || POPREFIX_ITEM
    super(prop)
    this._inheritable.push('room')
    if (prop.exec) this.exec = prop.exec
  }

  setExec(fu) {
    this.exec_function = fu
  }

  unsetExec() {
    this.exec_function = undefined
  }

  exec(args, room, vt) {
    let it = this
    this.fire_event(vt, 'exec', args)
    if (this.exec_function) {
      return this.exec_function(this, args, room, vt)
    } else {
      return cmd_done(vt, [[it, 0]], it.text, 'exec', args)
    }
  }

  disappear () {
    this.room.removeItemByName(this.name)
  }

  moveTo (room) {
    this.room.removeItemByName(this.name)
    room.addItem(this)
    return this
  }

  empower (cmd) {
    let c = Command.get(cmd)
    this.exec = c.exec
    this.syntax = c.syntax
  }

  getSyntax (args, idx) {
    if (!this.syntax) return false
    return idx > this.syntax.length ? this.syntax[-1][0] : this.syntax[idx][0]
  }
}
class People extends Item {
  constructor(prop) {
    prop.poprefix = prop.poprefix || POPREFIX_PEOPLE
    super(prop)
  }
}
