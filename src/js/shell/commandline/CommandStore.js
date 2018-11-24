var ARGT = {}
let l = ['dir', 'file', 'alias', 'opt', 'instr', 'var', 'strictfile', 'cmdname', 'builtin', 'filename', 'filenew', 'dirnew', 'pattern', 'msgid']
l.forEach((i) => { ARGT[i] = [i] })

function _stdout (a) { return { stdout: a } }
function _stderr (a) { return { stderr: a } }

function Command (syntax, fu) {
  // syntax example : cmd dir [-d|-e] (undo|redo) -> [ARGT.dir(),ARGT.opt.concat(['-d','e']),ARGT.instr.concat['undo','redo']],
  // fu example : (args, ctx, vt) => console.log(args,ctx,vt)
  this.exec = fu
  this.syntax = syntax
}

inject(Command, {
  h: {},
  def: (name, syntax, fu) => Command.h[name] = new Command(syntax, fu),
  get: (n) => Command.h[n],
  prototype: {
    getSyntax: function (args, idx) {
      return idx > this.syntax.length ? this.syntax[-1][0] : this.syntax[idx][0]
    }
  }
})

var Builtin = {
  h: {},
  def (name, syntax, fu) {
    return (Builtin.h[name] = new Command(syntax, fu))
  },
  get: (n) => Builtin.h[n],
  keys: () => Object.keys(Builtin.h).filter(k => !Builtin.h[k].hidden),
  hide (query) {
    Builtin.h.keys().forEach((i) => {
      if (i.match(query)) _builtins[i].hidden = 1
    })
  },
  unhide (query) {
    Builtin.h.keys().forEach((i) => {
      if (i.match(query)) _builtins[i].hidden = 0
    })
  }
}

var global_fireables = { done: [] }
function global_fire (categ) {
  if (global_fireables[categ]) {
    while (fun = global_fireables[categ].shift()) {
      fun()
    }
  }
}
function global_fire_done () { global_fire('done') }

function cmd_done (vt, fireables, ret, cmd, args) {
  // fire events *_done when ret is shown
  // console.log('done', vt, fireables, ret, cmd, args)
  if (typeof ret === 'string') {
    ret = _stdout(ret)
  }
  ret = new Seq(ret)
  ret.infect(-1, (it) => {
    it.cb = () => {
      fireables.forEach((f) => {
        f[0].fire_event(vt, cmd + '_done', args, f[1])
        global_fire_done()
      })
    }
  })
  return ret
}
