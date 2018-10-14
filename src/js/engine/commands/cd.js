_defCommand('cd', [ARGT.dir], function (args, ctx, vt) {
  var cwd = ctx.room
  if (args.length > 1) {
    return _stderr(_('cmd_cd_flood'))
  } else if (args[0] === '-') {
    cwd.previous.previous = cwd
    enterRoom(cwd.previous, vt)
  } else if (args.length === 0) {
    return _stderr(_('cmd_cd_no_args') + (_hasRightForCommand('pwd') ? ('\n' + _('cmd_cd_no_args_pwd')) : ''))
  } else if (args[0] === '~') {
    $home.previous = cwd
    enterRoom($home, vt)
    return _stdout(_('cmd_cd_home'))
  } else if (args[0] === '..') {
    cwd.fire_event(vt, 'cd', args, 0)
    if (cwd.parents.length >= 1) {
      cwd.parents[0].previous = cwd
      return _stdout(_('cmd_cd_parent', enterRoom(cwd.parents[0], vt)))
    } else {
      return _stderr(_('cmd_cd_no_parent'))
    }
  } else if (args[0] === '.') {
    vt.push_img(img.room_none)
    return _stdout(_('cmd_cd', enterRoom(cwd, vt)))
  } else {
    var dest = cwd.traversee(args[0])
    var room = dest.room
    if ('cd' in room.cmd_hook) {
      hret = room.cmd_hook['cd'](args)
      if (def(hret)){
      if (d(hret.ret, false)) return hret.ret
      }
    }
    if (room && !dest.item_name) {
      if (room.executable) {
        room.previous = cwd
        return _stdout(_('cmd_cd', enterRoom(room, vt)))
      }
    }
    cwd.fire_event(vt, 'cd', args, 0, { 'unreachable_room': room })
    return _stderr(_('cmd_cd_failed', args))
  }
})
