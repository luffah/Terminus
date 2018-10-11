_defCommand('help', [ARGT.cmdname], function (args, ctx, vt) {
  ret = _('cmd_help_begin') + '\n'
  var c = _getUserCommands()
  for (var i = 0; i < c.length; i++) {
    ret += '<pre>' + c[i] + '\t</pre>: ' + _('help_' + c[i]) + '\n'
  }
  return _stdout(ret)
})
