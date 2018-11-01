function error(vt, cwd, err, args, i){
  cwd.fire_event(vt, err, args, i)
  return _stderr(_(err, args))
}

_defCommand('less', [ARGT.strictfile], function (args, ctx, vt) { // event arg -> object
  var cwd = ctx.room
  if (args.length < 1) {
    if ('less' in cwd.cmd_hook) {
      hret = cwd.cmd_hook['less'](args)
      if (hret.ret) return hret.ret
    }
    return error(vt, cwd, 'less_no_arg', args, 0)
  } else {
    var ret = []; var fireables = [];
    for (var i = 0; i < args.length; i++) {
      var tgt = ctx.traversee(args[i])
      var room = tgt.room
      if (room) {
        if ('less' in room.cmd_hook) {
          hret = room.cmd_hook['less']([args[i]])
          if (hret.ret) ret.push(hret.ret)
          if (hret.pass) continue
        }
        var item = tgt.item
        if (item) {
          if ('less' in item.cmd_hook) {
            hret = item.cmd_hook['less']([args[i]])
            if (hret.ret) ret.push(hret.ret)
            if (hret.pass) continue
          }
          vt.push_img(item.picture, { index: ret.length }) // Display image of item
          room.fire_event(vt, 'less', args, i)
          item.fire_event(vt, 'less', args, i)
          fireables.push([room, 0])
          fireables.push([item, i + 0])
          ret.push(_stdout(item.text))
        } else {
          ret.push(error(vt, cwd, 'item_not_exists', args))
        }
      } else {
        ret.push(error(vt, cwd, 'room_unreachable', args, i))
      }
    }
    return cmd_done(vt, fireables, ret, 'less', args)
  }
})
_aliasCommand('cat', 'less')
_aliasCommand('more', 'less')
