_defCommand('pwd', [], function (args, ctx, vt) {
  var cwd = ctx.room
  vt.push_img(cwd.picture)
  return _stdout(_(POPREFIX_CMD + 'pwd', [cwd.name]).concat('\n').concat(cwd.intro_text))
})
