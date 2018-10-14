// only valid for command names
_defCommand('man', [ARGT.cmdname], function (args, ctx, vt) { // event arg -> cmd
  if (args.length < 1) {
    return _stderr(_('cmd_man_no_query'))
  } else {
    cwd = ctx.room
    if ('man' in cwd.cmd_hook) {
      hret = cwd.cmd_hook['man'](args)
      if (d(hret.ret, false)) return hret.ret
    }
    if (('man_' + args[0]) in dialog) {
      return _stdout(_('man_' + args[0]))
    }
    return _stderr(_('cmd_man_not_found'))
  }
})
