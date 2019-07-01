Command.def('grep', [ARGT.pattern, ARGT.strictfile], function (args, env, sys) {
  let word = args[0]
  if (sys.stdin.length && args.length == 1){
    sys.stdout.write(sys.stdin.readlines().filter(function (line) { return (line.indexOf(word) > 0) }))
  } else {
    for (let f of get_files_args(args, grep, env, sys)) {
      sys.stdout.write(tgt.item.text.split('\n').filter(function (line) { return (line.indexOf(word) > 0) }))
    }
  }
})
