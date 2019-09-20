Builtin.def('echo', [ARGT.text], function (args, env, sys) {
  return { stdout: args.join(' ') }
})
