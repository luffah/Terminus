Builtin.def('help', [ARGT.alias], function (args, ctx, vt) {
  let cwd = ctx.h.r
  let hret = cwd.tryhook('help', args)
  if (hret && hret.ret) return hret.ret
  let ret = _('cmd_help_begin') + '\n'
  var c = ctx.getCommands()
  for (var i = 0; i < c.length; i++) {
    ret += '<pre>' + c[i] + '\t</pre>: ' + _('help_' + c[i]) + '\n'
  }
  return _stdout(ret)
})
