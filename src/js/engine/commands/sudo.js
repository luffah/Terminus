_defCommand('sudo', [ARGT.cmd], function (args, ctx, vt) {
  if (args[0] === 'less' && args[1] === 'Certificate') {
    ctx.room.ev.fire('tryEnterSudo')
    return
  } else {
    return _stderr(_('room_wrong_syntax'))
  }
  return _stderr(_('cannot_cast'))
})
