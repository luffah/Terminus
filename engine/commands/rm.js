Command.def('rm', [ARGT.file], function (args, ctx, vt) { // event arg -> object
  if (args.length < 1) {
    return _('cmd_rm_miss')
  } else {
    var ret = []
    var item, room, idx
    for (var i = 0; i < args.length; i++) {
      var tgt = ctx.traversee(args[i])
      room = tgt.room
      item = tgt.item
      let hret = item.tryhook('rm', [args[i]])
      if (hret) {
        if (hret.ret) ret.push(hret.ret)
        if (hret.pass) continue
      }
      idx = tgt.item_idx
      if (idx > -1) {
        if (room.ismod('w')) {
          var removedItem = room.removeItemByIdx(idx)
          if (removedItem) {
            room.fire(vt, 'rm', args, i)
            ret.push(_stdout(_('cmd_rm_done', [args[i]])))
            removedItem.fire(vt, 'rm', args, i)
          } else {
            ret.push(_stderr(_('cmd_rm_failed')))
          }
        } else if (item.cmd_text.rm) {
          ret.push(_stdout(item.cmd_text.rm))
        } else {
          ret.push(_stderr(_('cmd_rm_invalid')))
        }
      }
      return ret
    }
  }
})
