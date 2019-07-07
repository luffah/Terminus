function error (sys, cwd, err, args, i) {
  cwd.fire(sys, err, args, i)
  sys.stderr.write(_(err, args))
}

function get_files_args(args, cmd, env, sys){ // FIXME shall be auto for strictfile ?
  let cwd = env.cwd
  let files = []
  for (let i = 0; i < args.length; i++) {
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
        files.push([item, i])
      } else if (!tgt.item_name) {
        error(sys, cwd, 'invalid_param_folder', args)
      } else {
        error(sys, cwd, 'item_not_exists', args)
      }
    }
  }
  return files
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
    var ret = new CmdSeq();
    for (let [f, i] of get_files_args(args, 'less', env, sys)){
      f.room.fire(sys, 'less', args, i)
      f.fire(sys, 'less', args, i)
      ret.fireables.push([f.room, 0])
      ret.fireables.push([f, i])
      ret.push({ stdout: f.text, render: f })
    }
    return ret.done(sys, 'less', args)
  }
})
