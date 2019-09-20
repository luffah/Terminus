Builtin.def('sudo', [ARGT.cmd], function () {
// Command.def('sudo', [ARGT.cmd], function () {
  const task = this
  const [args, sys, env] = [task.args, task.io, task.env]

  var runCmd = function () {
    let cmdname = args.unshift()
    let cmd = task.env.getCommand(cmdname)
    task.args = args
    if (cmd) {
      task.run()
    } else {
      task.exit({code:1, stderr:_('cmd_not_found')})
    }
  }
  if (env.me == 'root') {
    runCmd()
  } else if (env.sudo) {
    task.env = env.altered({me: 'root'})
    runCmd()
  } else {
    sys.askpass(env.user.passwd, {
      success: function () {
        task.env.sudo = 1
        task.env = env.altered({me: 'root'})
        runCmd()
      },
      failure: function () {
        task.exit({code:1, stderr:_('sudo_wrong_password')})
      }
    })
  }
  // return { stderr : _('room_wrong_syntax') }
})
