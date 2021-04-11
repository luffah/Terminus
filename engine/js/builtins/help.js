Builtin.def('help', [ARGT.builtin], function (args, env, sys) {
  let ret = _('cmd_help_begin') + '\n'
  for (const c of env.getCommands()) {
    ret += '<pre>' + c + '\t</pre>: ' + _('help_' + c) + '\n'
  }
  return { stdout: ret }
})
