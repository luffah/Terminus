var ARGT = {}
let l=['dir', 'file', 'opt', 'instr', 'var', 'strictfile', 'cmdname', 'filename', 'filenew', 'dirnew', 'pattern', 'msgid'] 
l.forEach((i) => {ARGT[i] = [i]})

function _stdout(a){return {stdout:a};}
function _stderr(a){return {stderr:a};}

function Command (name, syntax, fu, prop) {
  // syntax example : cmd dir [-d|-e] (undo|redo) -> [ARGT.dir(),ARGT.opt.concat(['-d','e']),ARGT.instr.concat['undo','redo']],
  // fu example : (args, ctx, vt) => console.log(args,ctx,vt)
  this.fu = fu
  this.syntax = syntax
  prop = prop || {}
  this.group = prop.group || name
  this.owner = prop.owner || name
  this.executable = prop.executable || true
  this.mod = new Modes(prop.mod || 'a+x')
  this.preargs = prop.preargs || [] // default arguments (for aliases)
}
Command.prototype = {
  ismod: File.prototype.ismod,
  chmod: File.prototype.chmod,
  getSyntax: function(args, idx){
   return idx > this.syntax.length ? this.syntax[-1][0] : this.syntax[idx][0]
  }
}
var global_commands_fu = {}

function _defCommand (cmd, syntax, fu, prop) {
  global_commands_fu[cmd] = new Command(cmd, syntax, fu, prop)
}

function _setCommandGroup (group, commands) {
  for (let cmd in global_commands_fu) {
    if (commands.indexOf(cmd) > -1) {
      global_commands_fu[cmd].group = group
    }
  }
}

function _aliasCommand (cmd, cmdb, args) {
  var c = (isStr(cmdb)) ? global_commands_fu[cmdb] : cmdb
  _defCommand(cmd, c.syntax, c.fu)
  if (args) {
    global_commands_fu[cmd].preargs = args
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
  console.log('done',vt, fireables, ret, cmd, args)
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
