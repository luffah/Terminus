_defCommand('whoami', [], function (args, ctx, vt) { // event arg -> cmd
    return _stdout(ctx.currentuser)
  }
)
