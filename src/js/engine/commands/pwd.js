_defCommand('pwd', [], function (args, ctx, vt) {
  var cwd = ctx.room
  if ('pwd' in cwd.cmd_hook) {
    hret = cwd.cmd_hook['pwd'](args)
    if (d(hret.ret, false)) return hret.ret
  }
  vt.push_img(cwd.picture)
  return _stdout(_(POPREFIX_CMD + 'pwd', [cwd.name]).concat('\n').concat(cwd.text))
})
