new Builtin('cd', [ARGT.dir], function (args, env, sys) {
  let cwd = env.cwd
  if (args.length > 1) {
    return {stderr:_('cmd_cd_flood')}
  } else if (args.length === 0) {
    return {stderr:_('cmd_cd_no_args') + (env.hasRightForCommand('pwd') ? ('\n' + _('cmd_cd_no_args_pwd')) : '')}
  } else if (args[0] === '-' && cwd.previous.checkAccess(env)) {
    env.previous = cwd
    Room.enter(env.previous, env)
    // return cmdDone(env, [[cwd.previous, 0]], {}, 'cd', args)
    return {fireables:[[cwd.previous, 0]]}
  } else if (args[0] === '..') {
    cwd.fire(env, 'cd', args, 0)
    if (cwd.room && cwd.room.checkAccess(env)) {
      env.previous = cwd
      return {stdout:_('cmd_cd_parent', Room.enter(cwd.room, env)), fireables: [[home, 0]]}
      // return cmdDone(env, [[cwd.room, 0]],_stdout(_('cmd_cd_parent', Room.enter(cwd.room, env))), 'cd', args)
    } else return {stderr:_('cmd_cd_no_parent')}
  } else if (args[0] === '~') {
    let home = env.HOME
    if (home && home.checkAccess(env)) {
      env.previous = cwd
      Room.enter(home, env)
      return {stdout:_('cmd_cd_home'), fireables: [[home, 0]]}
      // return cmdDone(env, [[home, 0]], _stdout(_('cmd_cd_home')), 'cd', args)
    } else return {stderr:_('cmd_cd_no_home'), returncode:1}
  } else {
    let dest = env.traversee(args[0])
    let room = dest.room
    if (room) {
      if (room.checkAccess(env)) {
        let hret = room.tryhook('cd', args)
        if (hret && hret.ret) return hret.ret
        if (!dest.item_name) {
          env.previous = cwd
          // return cmdDone(env, [[room, 0]], _stdout(_('cmd_cd', Room.enter(room, env))), 'cd', args)
          return {stdout: Room.enter(room, env), fireables: [[room, 0]]}
        }
      } else {
        cwd.fire(env, 'cd', args, 0, { 'unreachable_room': room })
        return {stderr:_('permission_denied') + ' ' + _('room_forbidden')}
      }
    }
    cwd.fire(env, 'cd', args, 0, { 'unreachable_room': room })
    return {stderr:_('cmd_cd_failed', args)}
  }
}).hookable = false
