var ARGT = {
  _test: function (env, val, syn) {
    // console.log(env, val, syn)
    const f = ARGT._typedef[syn[0]]
    return f ? f(env, val, syn) : false
  },
  _typedef: { // TODO
    dir: (env, val) => !val.startsWith('-'),
    file: (env, val) => !val.startsWith('-'),
    alias: () => true,
    opt: () => true,
    instr: () => true,
    var: () => true,
    strictfile: () => true,
    cmdname: () => true,
    builtin: () => true,
    filename: () => true,
    filenew: () => true,
    dirnew: () => true,
    pattern: () => true,
    msgid: () => true,
    text: () => true
  },
  opts: (t) => ARGT.opt.concat(t)
}
Object.keys(ARGT._typedef).forEach((i) => { ARGT[i] = [i] })

class Functionnal {

  constructor (name, syntax, fu) {
    // syntax example : cmd dir [-d|-e] (undo|redo) -> [ARGT.dir,ARGT.opt.concat(['-d','e']),ARGT.instr.concat['undo','redo']],
    // fu example : (args, env, sys) => sys.stdout.write(env.HOME)
    this.exec = fu
    this.syntax = syntax
    this.function_name = name
  }

  copyPower (c) {
    c.exec = this.exec
    c.function_name = this.function_name
    c.syntax = this.syntax
  }

  getSyntax (idx) {
    return !this.syntax.length ? null : idx > this.syntax.length ? this.syntax[-1][0] : this.syntax[idx][0]
  }

}

class Command extends Functionnal {
  constructor (name, syntax, fu) {
    super(name, syntax, fu)
    Command.reg[name] = this
  }
}
Object.assign(Command, {
  reg: {},
  def (name, syntax, fu) {
    return new Command(name, syntax, fu)
  },
  get: (cmd) => Command.reg[cmd],
  _keys: () => Object.keys(Command.reg),
  keys: () => Command._keys(),
  tools: {
    parseArgs (args) {
      const indexed = args.map((s, i) => [s, i])
      return [
        indexed.filter((s) => s[0][0] !== '-'), // arguments
        this._getOpts(indexed.filter((s) => s[0][0] === '-')) // options
      ]
    },
    _getOpts (opts) {
      const ret = {}
      opts.forEach((it) => {
        if (it[0].slice(0, 2) === '--') {
          ret[it[0].slice(2)] = { idx: it[1] }
        } else {
          it[0].split('').forEach((c) => {
            ret[c] = { idx: it[1] }
          })
        }
      })
      return ret
    }
  }
})

class Builtin extends Functionnal {
  constructor (name, syntax, fu) {
    super(name, syntax, fu)
    Builtin.reg[name] = this
  }
}
Object.assign(Builtin, {
  reg: {},
  def (name, syntax, fu) {
    return new Builtin(name, syntax, fu)
  },
  hidden: {},
  get: (cmd) => Builtin.hidden[cmd] ? undefined : Builtin.reg[cmd],
  _keys: () => Object.keys(Builtin.reg),
  keys: () => Builtin._keys().filter(k => !Builtin.reg[k].hidden),
  hide (query) {
    Builtin._keys().forEach((i) => {
      if (i.match(query)) Builtin.hidden[i] = 1
    })
  },
  unhide (query) {
    Builtin._keys().forEach((i) => {
      if (i.match(query)) Builtin.hidden[i] = 0
    })
  }
})

class Builtin extends Functionnal {
  constructor (name, syntax, fu) {
    super(name, syntax, fu)
    Builtin.reg[name] = this
  }
}
Object.assign(Builtin, {
  reg: {},
  def (name, syntax, fu) {
    return new Builtin(name, syntax, fu)
  },
  hidden: {},
  get: (cmd) => Builtin.hidden[cmd] ? undefined : Builtin.reg[cmd],
  _keys: () => Object.keys(Builtin.reg),
  keys: () => Builtin._keys().filter(k => !Builtin.reg[k].hidden),
  hide (query) {
    Builtin._keys().forEach((i) => {
      if (i.match(query)) Builtin.hidden[i] = 1
    })
  },
  unhide (query) {
    Builtin._keys().forEach((i) => {
      if (i.match(query)) Builtin.hidden[i] = 0
    })
  }
})
