Command.def('groups', [], function (args, ctx, vt) { // event arg -> cmd
  return _stdout(ctx.user.groups.join(' '))
})
