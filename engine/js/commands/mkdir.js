Command.def('mkdir', [ARGT.dirnew], function () {
  const task = this
  const [args, sys, env] = [task.args, task.io, task.env]

  if (args.length === 1) {
    var tr = env.traversee(args[0])
    if (tr.room.ismod('w', env)) {
      const hret = tr.room.tryhook('mkdir', args)
      if (hret && hret.ret) return hret.ret
      if (!tr.item) {
        tr.room.addDoor(new Room(tr.item_name))
        env.cwd.fire(sys, 'mkdir', args, 0)
        return { stdout: _('room_new_created', args) }
      }
      return { stderr: _('tgt_already_exists', [args[0]]) }
    }
    return { stderr: _('permission_denied') + ' ' + _('room_not_writable') }
  }
  return { stderr: _('incorrect_syntax') }
})
