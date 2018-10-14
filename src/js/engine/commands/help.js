_defCommand('help', [ARGT.cmdname], function (args, ctx, vt) {
  cwd = ctx.room
  if ('help' in cwd.cmd_hook) {
    hret = cwd.cmd_hook['help'](args)
    if (d(hret.ret, false)) return hret.ret
  }
  ret = _('cmd_help_begin') + '\n'
  var c = _getUserCommands()
  for (var i = 0; i < c.length; i++) {
    ret += '<pre>' + c[i] + '\t</pre>: ' + _('help_' + c[i]) + '\n'
  }
  return _stdout(ret)
})
