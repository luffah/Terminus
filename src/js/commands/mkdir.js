Command.def('mkdir', [ARGT.dirnew], function (args, ctx, vt) { // event arg -> created dir
  if (args.length === 1) {
    var tr = ctx.traversee(args[0])
    if (tr.room.ismod('w', ctx)) {
      if ('mkdir' in tr.room.cmd_hook) {
        hret = tr.room.cmd_hook['grep'](args)
        if (d(hret.ret, false)) return hret.ret
      }
      if (!tr.item) {
        tr.room.addDoor(new Room(tr.item_name))
        ctx.h.r.fire_event(vt, 'mkdir', args, 0)
        return _stdout(_('room_new_created', args))
      }
      return _stderr(_('tgt_already_exists', [args[0]]))
    }
    return _stderr(_('permission_denied') + ' ' + _('room_not_writable'))
  }
  return _stderr(_('incorrect_syntax'))
})
