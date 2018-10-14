_defCommand('less', [ARGT.strictfile], function (args, ctx, vt) { // event arg -> object
  var cwd = ctx.room
  if (args.length < 1) {
    if ('less' in cwd.cmd_hook) {
      hret = cwd.cmd_hook['less'](args)
      if (d(hret.ret, false)) return hret.ret
    }
    cwd.fire_event(vt, 'less_no_arg', args, 0)
    return _stderr(_('cmd_less_no_arg'))
  } else {
    var ret = []
    for (var i = 0; i < args.length; i++) {
      var tgt = cwd.traversee(args[i])
      var room = tgt.room
      if ('less' in room.cmd_hook) {
         hret = room.cmd_hook['less']([args[i]])
         if (d(hret.ret, false)) ret.push(hret.ret)
         if (d(hret.pass, false)) continue
      }
      if (room) {
        var item = tgt.item
        if (item) {
          if ('less' in item.cmd_hook) {
            hret = item.cmd_hook['less']([args[i]])
            if (d(hret.ret, false)) ret.push(hret.ret)
            if (d(hret.pass, false)) continue
          }
          vt.push_img(item.picture, { index: ret.length }) // Display image of item
          room.fire_event(vt, 'less', args, i)
          item.fire_event(vt, 'less', args, i)
          ret.push(cmd_done(vt, [[room, 0], [item, i + 0]], item.text, 'less', args))
        } else {
          room.fire_event(vt, 'destination_unreachable', args, i)
          ret.push(_stderr(_('item_not_exists', args)))
        }
      } else {
        room.fire_event(vt, 'destination_unreachable', args, i)
        // FIXME : msg -> stdin stdout sderr
        ret.push(_stderr(_('room_unreachable')))
      }
    }
    return new ReturnSequence(ret)
  }
})
_aliasCommand('cat', 'less')
_aliasCommand('more', 'less')
