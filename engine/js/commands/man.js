// only valid for command names
Command.def('man', [ARGT.cmdname], function () {
  const task = this
  const [args, sys, env] = [task.args, task.io, task.env]

  if (args.length < 1) {
    return { stderr: _('cmd_man_no_query') }
  } else {
    const hret = env.cwd.tryhook('man', args)
    if (hret && hret.ret) return hret.ret
    if (('man_' + args[0]) in dialog) {
      return { stdout: _('man_' + args[0]) }
    }
    return { stderr: _('cmd_man_not_found') }
  }
})
