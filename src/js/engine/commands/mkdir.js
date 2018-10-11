_defCommand('mkdir', [ARGT.dirnew], function (args, ctx, vt) { // event arg -> created dir
  var cwd = ctx.room
  if (args.length === 1) {
    var tr = cwd.traversee(args[0])
    if (tr.room.writable) {
      if (!tr.item) {
        tr.room.addPath(new Room(cwd.item_name))
        cwd.fire_event(vt, 'mkdir', args, 0)
        return _stdout(_('room_new_created', args))
      }
      return _stderr(_('tgt_already_exists', [args[0]]))
    }
    return _stderr(_('permission_denied') + ' ' + _('room_not_writable'))
  }
  return _stderr(_('incorrect_syntax'))
})
