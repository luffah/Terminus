Builtin.def('pwd', [], function (args, ctx, vt) {
  let cwd = ctx.h.r
  let hret = cwd.tryhook('pwd', args)
  if (hret && hret.ret) return hret.ret
  // vt.push_img(cwd.img)
  return _stdout(_(POPREFIX_CMD + 'pwd', [cwd.name]).concat('\n').concat(cwd.text))
})
