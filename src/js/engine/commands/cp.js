_defCommand('cp', [ARGT.file, ARGT.filenew], function (args, ctx, vt) { // event arg -> destination item
  if (args.length != 2) {
    return _stderr(_('incorrect_syntax'))
  } else {
    var src = ctx.room.traversee(args[0])
    var dest = ctx.room.traversee(args[1])
    if (src.item) {
      if (dest.item) {
        return _stderr(_('tgt_already_exists', [dest.item_name]))
      } else if (dest.room) {
        nut = src.item.copy(dest.item_name)
        dest.room.addItem(nut)
        nut.fire_event(vt, 'cp', args, 1)
        src.item.fire_event(vt, 'cp', args, 0)
        dest.room.fire_event(vt, 'cp', args, 1)

        return cmd_done(vt, [[src.item, 0], [nut, 1]], _stdout(_('cmd_cp_copied', args)), 'cp', args)
      }
    }
    return _stderr(_('cmd_cp_unknown'))
  }
})
