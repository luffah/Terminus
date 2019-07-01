function error (sys, cwd, err, args, i) {
  cwd.fire(sys, err, args, i)
  sys.stderr.write(_(err, args))
}

function get_files_args(args, cmd, env, sys){ // FIXME shall be auto for strictfile ?
  let cwd = env.cwd
  let files = []
  for (var i = 0; i < args.length; i++) {
    var tgt = env.traversee(args[i])
    var room = tgt.room
    if (room) {
      let hret = room.tryhook(cmd, [args[i]])
      if (hret) {
        if (hret.ret) ret.push(hret.ret)
        if (hret.pass) continue
      }
      // console.log(tgt)
      var item = tgt.item
      if (item) {
        let hret = item.tryhook(cmd, [args[i]])
        if (hret) {
          if (hret.ret) ret.push(hret.ret)
          if (hret.pass) continue
        }
        files.push({item:item, room:room, i:i})
      } else if (!tgt.item_name) {
        error(sys, cwd, 'invalid_param_folder', args)
      } else {
        error(sys, cwd, 'item_not_exists', args)
      }
    }
  }
}

Command.def('less', [ARGT.strictfile], function (args, env, sys, cmd) { // event arg -> object
  let cwd = env.cwd
  if (sys.stdin.length) {
     if (!args.length) {
       return {stdout: sys.stdin.readlines()}
     }
  }
  if (args.length < 1) {
    let hret = cwd.tryhook('less', args)
    if (hret && hret.ret) return hret.ret
    return error(sys, cwd, 'less_no_arg', [cmd.name].concat(args), 0)
  } else {
    var ret = []; var fireables = []

    for (let f of get_files_args(args, 'less', env, sys)){
          f.room.fire(sys, 'less', args, f.i)
          f.item.fire(sys, 'less', args, f.i)
          fireables.push([f.room, 0])
          fireables.push([f.item, f.i + 0])
          // console.log(item.text)
          ret.push({ stdout: f.item.text, render: f.item })
    }
    return cmdDone(sys, fireables, ret, 'less', args)
  }
})
