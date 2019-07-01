Builtin.def('show_credits', [], function (args, ctx, vt) { // event arg -> cmd
  return _stdout(credits().join(' '))
})

