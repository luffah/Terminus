Builtin.def('help', [ARGT.builtin], function (args, ctx, vt) {
  let cwd = ctx.h.r
  if ('help' in cwd.cmd_hook) {
    hret = cwd.cmd_hook['help'](args)
    if (d(hret.ret, false)) return hret.ret
  }
  ret = _('cmd_help_begin') + '\n'
  var c = ctx.getCommands()
  for (var i = 0; i < c.length; i++) {
    ret += '<pre>' + c[i] + '\t</pre>: ' + _('help_' + c[i]) + '\n'
  }
  return _stdout(ret)
})
