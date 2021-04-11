Command.def('whoami', [], function (args, ctx, vt) { // event arg -> cmd
  return { stdout: ctx.me }
}
)
