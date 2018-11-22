Builtin.def('cd', [ARGT.dir], function (args, ctx, vt) {
  let cwd = ctx.h.r
  if (args.length > 1) {
    return _stderr(_('cmd_cd_flood'))
  } else if (args.length === 0) {
    return _stderr(_('cmd_cd_no_args') + (ctx.hasRightForCommand('pwd') ? ('\n' + _('cmd_cd_no_args_pwd')) : ''))
  } else if (args[0] === '-' && cwd.previous.checkAccess(ctx)){
      ctx.previous_room = cwd
      enterRoom(cwd.previous, vt)
      return cmd_done(vt, [[cwd.previous, 0]], {}, 'cd', args)
  } else if (args[0] === '..') {
    cwd.fire_event(vt, 'cd', args, 0)
    if (cwd.room && cwd.room.checkAccess(ctx)) {
      ctx.previous_room = cwd
      return _stdout(_('cmd_cd_parent', enterRoom(cwd.room, vt)))
    } else return _stderr(_('cmd_cd_no_parent'))
  } else if (args[0] === '~') {
    let home = ctx.getDir('~')
    if (home && home.checkAccess(ctx)) {
    ctx.previous_room = cwd
    enterRoom(home, vt)
    return cmd_done(vt, [[home, 0]], _stdout(_('cmd_cd_home')), 'cd', args)
    } else return _stderr(_('cmd_cd_no_home'))
  } else {
    let dest = ctx.traversee(args[0])
    let room = dest.room
    if (room) {
      if (room.checkAccess(ctx)) {
        if ('cd' in room.cmd_hook) {
          hret = room.cmd_hook['cd'](args)
          if (def(hret)){
          if (d(hret.ret, false)) return hret.ret
          }
        }
        if (!dest.item_name) {
          ctx.previous_room = cwd
          return cmd_done(vt, [[room, 0]], _stdout(_('cmd_cd', enterRoom(room, vt))), 'cd', args)
        }
      } else {
          cwd.fire_event(vt, 'cd', args, 0, { 'unreachable_room': room })
          return _stderr(_('permission_denied') + ' ' + _('room_forbidden'))
      }
    }
    cwd.fire_event(vt, 'cd', args, 0, { 'unreachable_room': room })
    return _stderr(_('cmd_cd_failed', args))
  }
})
