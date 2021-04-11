Command.def('rm', [ARGT.file], function () { // event arg -> object
  const task = this
  const [args, sys, env] = [task.args, task.io, task.env]

  if (args.length < 1) {
    return _('cmd_rm_miss')
  } else {
    var ret = []
    var item, room, idx
    for (var i = 0; i < args.length; i++) {
      var tgt = env.traversee(args[i])
      room = tgt.room
      item = tgt.item
      const hret = item.tryhook('rm', [args[i]])
      if (hret) {
        if (hret.ret) ret.push(hret.ret)
        if (hret.pass) continue
      }
      idx = tgt.item_idx
      if (idx > -1) {
        if (room.ismod('w')) {
          var removedItem = room.removeItemByIdx(idx)
          if (removedItem) {
            room.fire(sys, 'rm', args, i)
            // ret.push(_stdout(_('cmd_rm_done', [args[i]])))
            ret.push({ stdout: _('cmd_rm_done', [args[i]]) })
            removedItem.fire(sys, 'rm', args, i)
          } else {
            // ret.push(_stderr(_('cmd_rm_invalid')))
            ret.push({ stderr: _('cmd_rm_failed') })
          }
        // } else if (item.cmd_text.rm) {
        //   ret.push(_stdout(item.cmd_text.rm))
        } else {
          // ret.push(_stderr(_('cmd_rm_invalid')))
          ret.push({ stderr: _('cmd_rm_invalid') })
        }
      }
      return ret
    }
  }
})
