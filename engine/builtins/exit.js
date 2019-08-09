Builtin.def('exit', [], function (args, env, sys) {
  setTimeout(() => {
    dom.body.innerHTML = _('cmd_exit_html')
  }, 2000)
  return {stdout:_('cmd_exit')}
})
