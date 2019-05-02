class File extends FileModel {
  constructor (prop) {
    super(prop)
    this._inheritable = ['poprefix']
    this._clonable = ['cmd_event', 'cmd_hook', 'text']
    this._copiable = ['img']
    this.cmd_hook = {}
    this.room = prop.room
    this.mod = new Modes()
    this.set(inject(
      { mod: this.default.mod,
        owner: (prop.room ? prop.room.owner : this.default.owner),
        group: (prop.room ? prop.room.group : this.default.group),
        tgt: this }, prop)
    )
  }

  set (prop) {
    if (prop.id) this.id = prop.id
    if (prop.name) this.name = prop.name
    if (prop.text) this.text = prop.text
    if (prop.tgt) this.tgt = prop.tgt
    if (prop.mod) this.chmod(prop.mod)
    if (prop.syntax) this.syntax = prop.syntax
    if (prop.group) this.group = prop.group || prop.id
    if (prop.owner) this.owner = prop.owner || prop.id
    if (def(prop.v)) this.v = prop.v // contextual variable
    if (prop.var) {
      this.var = prop.var || prop.id
      window[this.var] = this
    }
    let h = prop.hooks
    if (h) {
      Object.keys(h).forEach((i) => {
        this.setHook(i, h[i] || _(prop.poid + '_' + i))
      })
    }
    super.set(prop)
    return this
  }

  copy (name) {
    let nut = this.constructor(name)
    for (let attr in this._copiable) {
      if (this.hasOwnProperty(attr)) nut[attr] = this[attr].copy()
    }
    for (let attr in this._clonable) {
      if (this.hasOwnProperty(attr)) nut[attr] = clone(this[attr])
    }
    for (let attr in this._inheritable) {
      if (this.hasOwnProperty(attr)) nut[attr] = this[attr]
    }
    return nut
  }

  stringify () { return this.tgt.var }

  static parse (str) {
    return window[str]
  }

  is (r) { return this.tgt.uid === r.tgt.uid }

  toString () { return this.name }

  ismod (right, ctx) {
    if (this.mod.get('o', right)) return true
    if (ctx) {
      return (
        (ctx.user.groups.includes(this.group) &&
          this.mod.get('g', right)) ||
        (ctx.me === this.owner &&
          this.mod.get('u', right)))
    }
  }

  chmod (s) { this.mod.parse(s) }

  setHook (cmd, fu) {
    if (typeof fu === 'object') {
      fu = () => { return { ret: fu } }
    } else if (typeof fu === 'string') {
      fu = () => { return { ret: _stdout(fu), pass: true } }
    }
    this.cmd_hook[cmd] = fu
    return this
  }

  unsetHook (cmd) {
    delete this.cmd_hook[cmd]
    return this
  }

  tryhook (cmd, args) {
    let f = this.cmd_hook[cmd]
    if (f) {
      let ret = f(this, args)
      if (def(ret.ret)) return ret
      return { ret: ret, pass: (ret.pass != 0) }
    }
  }

  toPathStr (base) {
    if (!base) {
      return (this.room ? this.room.toPathStr() : '') + '/' + this.toString()
    }
  }
}

class Item extends File {
  constructor (prop) {
    prop.poprefix = prop.poprefix || POPREFIX_ITEM
    super(prop)
    this._inheritable.push('room')
  }

  set (prop) {
    super.set(prop)
    if (prop.cmd) this.emPower(prop.cmd || prop.id)
    else {
      this.exec = prop.exec || this.defaultExec
      this.syntax = prop.syntax || []
    }
    if (prop.init) prop.init(this)
  }

  defaultExec (args, room, vt) {
    this.fire(vt, 'exec', args)
    return cmdDone(vt, [[this, 0]], this.text, 'exec', args)
  }

  disappear () {
    this.room.removeItemByName(this.name)
  }

  moveTo (room) {
    this.room.removeItemByName(this.name)
    room.addItem(this)
    return this
  }

  emPower (cmd) {
    this.copyPower(Command.get(cmd))
  }

  copyPower (c) {
    this.exec = c.exec
    this.syntax = c.syntax
  }

  disPower () {
    this.exec = this.defaultExec
    this.syntax = []
  }

  getSyntax (idx) {
    if (!this.syntax) return false
    return idx > this.syntax.length ? this.syntax[-1][0] : this.syntax[idx][0]
  }
}

class People extends Item {
  constructor (prop) {
    prop.poprefix = prop.poprefix || POPREFIX_PEOPLE
    super(prop)
  }
}
