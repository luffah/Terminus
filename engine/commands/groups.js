Command.def('groups', [], function (args, ctx, vt) { // event arg -> cmd
  return { stdout: ctx.user.groups.join(' ') }
})
