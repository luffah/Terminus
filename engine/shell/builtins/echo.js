Builtin.def('echo', [ARGT.text], function (args, ctx, vt) {
  let cwd = ctx.h.r
  let hret = cwd.tryhook('echo', args)
  if (hret && hret.ret) return hret.ret
  return _stdout(args.join(' '))
})
