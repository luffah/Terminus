FileModel.prototype._inheritable = ['poprefix']
FileModel.prototype._clonable = ['cmd_event', 'cmd_hook', 'text']
FileModel.prototype._copiable = []
class File extends FileModel {
  constructor (prop) {
    super(prop)
    this.cmd_hook = {}
    this.room = null
    this.mod = new Modes()
    this.set(inject(
      { mod: File.mod,
        owner: (this.room ? this.room.owner : File.owner),
        group: (this.room ? this.room.group : File.group),
        tgt: this }, prop)
    )
  }

  set (prop) {
    const t = this
    t.consume(prop, ['group', 'owner'])
    const p = consume(prop, ['mod', 'var', 'hooks'])
    if (p.mod) t.chmod(p.mod)
    if (p.var) {
      t.var = p.var
      window[t.var] = t
    }
    if (p.hooks) {
      Object.keys(p.hooks).forEach((i) => {
        this.setHook(i, p.hooks[i] || _(t.poid + '_' + i))
      })
    }
    super.set(prop)
    return this
  }

  copy (name) {
    const nut = this.constructor(name)
    for (const attr in this._copiable) {
      if (this.hasOwnProperty(attr)) nut[attr] = this[attr].copy()
    }
    for (const attr in this._clonable) {
      if (this.hasOwnProperty(attr)) nut[attr] = clone(this[attr])
    }
    for (const attr in this._inheritable) {
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

  get path () {
    return (this.room ? this.room.path + '/' + this.name : '')
  }

  relativepath (base) {
    return (this.room && this.uid !== base.uid ? this.room.relativepath(base) + '/' + this.name : (this.room ? '.' : ''))
  }

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
      fu = () => { return { ret: { stdout: fu }, pass: true } }
    }
    this.cmd_hook[cmd] = fu
    return this
  }

  unsetHook (cmd) {
    delete this.cmd_hook[cmd]
    return this
  }

  tryhook (cmdname, args, cmd) {
    const f = this.cmd_hook[cmdname]
    if (f) {
      const ret = f(this, cmd, args, env, sys)
      if (def(ret.ret)) return ret
      return { ret: ret, pass: (ret.pass != 0) } // eslint-disable-line
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
    if (prop.cmd) this.emPower(prop.cmd)
    else {
      this.exec = prop.exec || this.defaultExec
      this.syntax = prop.syntax || []
    }
    if (prop.init) prop.init(this)
  }

  defaultExec (args, env, sys, cmd, arrs) {
    this.fire('exec', args, env, sys, 0)
    return { fireables: [[this, 0]], stdout: this.text }
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
    Command.get(cmd).copyPower(this)
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

class RenderTree { /* class for extra rendering, a kind of abstract fs */
  constructor (root, leafs) {
    this.root = root
    this.leafs = leafs
  }
}
