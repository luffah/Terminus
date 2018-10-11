_defCommand('exit', [], function (args, ctx, vt) {
  setTimeout(function () {
    dom.body.innerHTML = _('cmd_exit_html')
  }, 2000)
  return _stdout(_('cmd_exit'))
})
