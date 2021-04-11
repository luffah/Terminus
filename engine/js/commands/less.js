function error (sys, cwd, err, args, i) {
  cwd.fire(sys, err, args, i)
  sys.stderr.write(_(err, args))
}

function get_files_args (args, cmd, env, sys) { // FIXME shall be auto for strictfile ?
  const cwd = env.cwd
  const files = []
  for (let i = 0; i < args.length; i++) {
    var tgt = env.traversee(args[i])
    var room = tgt.room
    if (room) {
      const hret = room.tryhook(cmd, [args[i]])
      if (hret) {
        if (hret.ret) ret.push(hret.ret)
        if (hret.pass) continue
      }
      // console.log(tgt)
      var item = tgt.item
      if (item) {
        const hret = item.tryhook(cmd, [args[i]])
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

Command.def('less', [ARGT.strictfile], function () { // event arg -> object
  const task = this
  const [args, sys, env] = [task.args, task.io, task.env]

  const cwd = env.cwd
  if (sys.stdin.length) {
    if (!args.length) {
      return { stdout: sys.stdin.readlines() }
    }
  }
  if (args.length < 1) {
    const hret = cwd.tryhook('less', args)
    if (hret && hret.ret) return hret.ret
    return error(sys, cwd, 'less_no_arg', [task.cmd.name].concat(args), 0)
  } else {
    // var ret = new CmdSeq()
    for (const [f, i] of get_files_args(args, 'less', env, sys)) {
      let fireables = [[f.room, 0], [f, i]]
      sys.fire(fireables)
      sys.push({ stdout: f.text, render: f, fireables: fireables })
    }
    // return ret.done(sys, 'less', args)
    task.exit()
  }
  // if (args.length < 1) {
  //   const hret = cwd.tryhook('less', args)
  //   if (hret && hret.ret) return hret.ret
  //   return error(sys, cwd, 'less_no_arg', [task.cmd.name].concat(args), 0)
  // } else {
  //   var ret = new CmdSeq()
  //   for (const [f, i] of get_files_args(args, 'less', env, sys)) {
  //     f.room.fire(sys, 'less', args, i)
  //     f.fire(sys, 'less', args, i)
  //     ret.fireables.push([f.room, 0])
  //     ret.fireables.push([f, i])
  //     ret.push({ stdout: f.text, render: f })
  //   }
  //   return ret.done(sys, 'less', args)
  // }
})
