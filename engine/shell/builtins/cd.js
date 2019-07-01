Builtin.def('cd', [ARGT.dir], function (args, env, sys) {
  let cwd = env.cwd
  if (args.length > 1) {
    return _stderr(_('cmd_cd_flood'))
  } else if (args.length === 0) {
    return _stderr(_('cmd_cd_no_args') + (env.hasRightForCommand('pwd') ? ('\n' + _('cmd_cd_no_args_pwd')) : ''))
  } else if (args[0] === '-' && cwd.previous.checkAccess(env)) {
    env.previous = cwd
    Room.enter(env.previous, env)
    return cmdDone(env, [[cwd.previous, 0]], {}, 'cd', args)
  } else if (args[0] === '..') {
    cwd.fire(env, 'cd', args, 0)
    if (cwd.room && cwd.room.checkAccess(env)) {
      env.previous = cwd
      return cmdDone(env, [[cwd.room, 0]],_stdout(_('cmd_cd_parent', Room.enter(cwd.room, env))), 'cd', args)
    } else return _stderr(_('cmd_cd_no_parent'))
  } else if (args[0] === '~') {
    let home = env.getDir('~')
    if (home && home.checkAccess(env)) {
      env.previous = cwd
      Room.enter(home, env)
      return cmdDone(env, [[home, 0]], _stdout(_('cmd_cd_home')), 'cd', args)
    } else return _stderr(_('cmd_cd_no_home'))
  } else {
    let dest = env.traversee(args[0])
    let room = dest.room
    if (room) {
      if (room.checkAccess(env)) {
        let hret = room.tryhook('cd', args)
        if (hret && hret.ret) return hret.ret
        if (!dest.item_name) {
          env.previous = cwd
          return cmdDone(env, [[room, 0]], _stdout(_('cmd_cd', Room.enter(room, env))), 'cd', args)
        }
      } else {
        cwd.fire(env, 'cd', args, 0, { 'unreachable_room': room })
        return _stderr(_('permission_denied') + ' ' + _('room_forbidden'))
      }
    }
    cwd.fire(env, 'cd', args, 0, { 'unreachable_room': room })
    return _stderr(_('cmd_cd_failed', args))
  }
})
