function error (vt, cwd, err, args, i) {
  cwd.fire(vt, err, args, i)
  return _stderr(_(err, args))
}

Command.def('less', [ARGT.strictfile], function (args, ctx, vt, cmd) { // event arg -> object
  let cwd = ctx.h.r
  if (args.length < 1) {
    let hret = cwd.tryhook('less', args)
    if (hret && hret.ret) return hret.ret
    return error(vt, cwd, 'less_no_arg', [cmd.name].concat(args), 0)
  } else {
    var ret = []; var fireables = []
    for (var i = 0; i < args.length; i++) {
      var tgt = ctx.traversee(args[i])
      var room = tgt.room
      if (room) {
        let hret = room.tryhook('less', [args[i]])
        if (hret) {
          if (hret.ret) ret.push(hret.ret)
          if (hret.pass) continue
        }
        // console.log(tgt)
        var item = tgt.item
        if (item) {
          let hret = item.tryhook('less', [args[i]])
          if (hret) {
            if (hret.ret) ret.push(hret.ret)
            if (hret.pass) continue
          }
          room.fire(vt, 'less', args, i)
          item.fire(vt, 'less', args, i)
          fireables.push([room, 0])
          fireables.push([item, i + 0])
          // console.log(item.text)
          ret.push({ stdout: item.text, pic: vt.mkImg(item) })
        } else if (!tgt.item_name) {
          ret.push(error(vt, cwd, 'invalid_param_folder', args))
        } else {
          ret.push(error(vt, cwd, 'item_not_exists', args))
        }
      } else {
        ret.push(error(vt, cwd, 'room_unreachable', args, i))
      }
    }
    return cmdDone(vt, fireables, ret, 'less', args)
  }
})
