Builtin.def('alias', [ARGT.alias], function (args, env, sys) {
  const hret = env.cwd.tryhook('help', args)
  if (hret && hret.ret) return hret.ret
  let ret = _('cmd_help_begin') + '\n'
  var c = env.getCommands()
  for (var i = 0; i < c.length; i++) {
    ret += '<pre>' + c[i] + '\t</pre>: ' + _('help_' + c[i]) + '\n'
  }
  return { stdout: ret }
})
