var ARGT = {
  _test: function (env, val, syn) {
    // console.log(env, val, syn)
    let f = ARGT._typedef[syn[0]]
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

function _stdout (a) { return { stdout: a } }
function _stderr (a) { return { stderr: a } }
function _getOpts (opts) {
  let ret = {}
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

function Command (syntax, fu) {
  // syntax example : cmd dir [-d|-e] (undo|redo) -> [ARGT.dir,ARGT.opt.concat(['-d','e']),ARGT.instr.concat['undo','redo']],
  // fu example : (args, env, sys) => sys.stdout.write(env.HOME)
  this.exec = fu
  this.syntax = syntax
}

inject(Command, {
  h: {},
  def: (name, syntax, fu) => { Command.h[name] = new Command(syntax, fu); return Command.h[name] },
  get: (n) => Command.h[n],
  prototype: {
    getSyntax: function (idx) {
      return !this.syntax.length ? null : idx > this.syntax.length ? this.syntax[-1][0] : this.syntax[idx][0]
    }
  },
  tools: {
    parseArgs : function (args){
      let indexed = args.map((s, i) => [s, i])
      return [
        indexed.filter((s) => s[0][0] !== '-'),  //arguments
        _getOpts(indexed.filter((s) => s[0][0] === '-')) // options
      ]
    }
  }
})

var Builtin = {
  h: {},
  def (name, syntax, fu) {
    return (Builtin.h[name] = new Command(syntax, fu))
  },
  get: (n) => Builtin.h[n],
  _keys: () => Object.keys(Builtin.h),
  keys: () => Builtin._keys().filter(k => !Builtin.h[k].hidden),
  hide (query) {
    Builtin._keys().forEach((i) => {
      if (i.match(query)) Builtin.h[i].hidden = 1
    })
  },
  unhide (query) {
    Builtin._keys().forEach((i) => {
      if (i.match(query)) Builtin.h[i].hidden = 0
    })
  }
}

var globalFireables = { done: [] }
function globalFire (categ) {
  let f = globalFireables[categ]
  if (f) {
    while (f.length) {
      f.shift()()
    }
  }
}
function globalFireDone () { globalFire('done') }

class CmdSeq extends Seq {
  constructor() {
    super()
    this.fireables = []
  }
  done(sys, cmd, args) {
    // fire events *_done when ret is shown
    let s = this
    this.infect(-1, (it) => {
      it.cb = () => {
        s.fireables.forEach((f) => {
          f[0].fire(vt, cmd + '_done', args, f[1])
          globalFireDone()
        })
      }
    })
    return this
  }
}
