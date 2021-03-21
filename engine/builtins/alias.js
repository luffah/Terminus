Builtin.def('alias', [ARGT.alias], function (args, env, sys) {
  // const hret = env.cwd.tryhook('alias', args)
  // if (hret && hret.ret) return hret.ret
  let ret = _('cmd_help_begin') + '\n'
  // let ret = _('cmd_help_begin') + '\n'
  // Object.keys(env.a).forEach((i) => {
  //   ret += '<pre>' + i + '\t</pre>: ' + env.a[i] + '\n'
  // })
  return { stdout: ret }
})
