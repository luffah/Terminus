Command.def('mkdir', [ARGT.dirnew], function (args, ctx, vt) { // event arg -> created dir
  if (args.length === 1) {
    var tr = ctx.traversee(args[0])
    if (tr.room.ismod('w', ctx)) {
      let hret = tr.room.tryhook('mkdir', args)
      if (hret && hret.ret) return hret.ret
      if (!tr.item) {
        tr.room.addDoor(new Room(tr.item_name))
        ctx.h.r.fire(vt, 'mkdir', args, 0)
        return {stdout:_('room_new_created', args)}
      }
      return {stderr:_('tgt_already_exists', [args[0]])}
    }
    return {stderr:_('permission_denied') + ' ' + _('room_not_writable')}
  }
  return {stderr:_('incorrect_syntax')}
})
