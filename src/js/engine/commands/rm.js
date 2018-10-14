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
      if ('rm' in item.cmd_hook) {
        hret = item.cmd_hook['rm']([args[i]])
        if (def(hret)){
        if (d(hret.ret, false)) ret.push(hret.ret)
        if (d(hret.pass, false)) continue
        }
      }
      idx = tgt.item_idx
      if (idx > -1) {
        if (room.writable) {
          var removedItem = room.removeItemByIdx(idx)
          if (removedItem) {
            room.fire_event(vt, 'rm', args, i)
            ret.push(_stdout(_('cmd_rm_done', [args[i]])))
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
