_defCommand('rm', [ARGT.file], function (args, ctx, vt) { // event arg -> object
  if (args.length < 1) {
    return _('cmd_rm_miss')
  } else {
    var ret = []
    var item, room, idx
    for (var i = 0; i < args.length; i++) {
      var tgt = ctx.room.traversee(args[i])
      room = tgt.room
      item = tgt.item
      idx = tgt.item_idx
      if (idx > -1) {
        if (room.writable) {
          var removedItem = room.removeItemByIdx(idx)
          if (removedItem) {
            room.fire_event(vt, 'rm', args, i)
            if ('rm' in removedItem.cmd_text) {
              ret.push(_stdout(removedItem.cmd_text.rm + '\n'))
            } else {
              ret.push(_stdout(_('cmd_rm_done', [args[i]])))
            }
            removedItem.fire_event(vt, 'rm', args, i)
          } else {
            ret.push(_stderr(_('cmd_rm_failed')))
          }
        } else if (item.cmd_text.rm) {
          ret.push(_stdout(item.cmd_text.rm))
        } else {
          ret.push(_stderr(_('cmd_rm_invalid')))
        }
      }
      return new ReturnSequence(ret)
    }
  }
})
