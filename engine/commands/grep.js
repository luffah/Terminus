Command.def('grep', [ARGT.pattern, ARGT.strictfile], function (args, ctx, vt) {
  let cwd = ctx.r
  let word = args[0]
  let ret = []
  for (var i = 1; i < args.length; i++) {
    var tgt = ctx.traversee(args[1])
    if (tgt.item) {
      let hret = cwd.tryhook('grep', [word, args[i]])
      if (hret) {
        if (hret.ret) ret.push(hret.ret)
        if (hret.pass) continue
      }
      let arr = tgt.item.text.split('\n').filter(function (line) { return (line.indexOf(word) > 0) })
      ret.push(_stdout(arr.join('\n')))
    } else {
      ret.push(_stderr(_('item_not_exists', [args[1]])))
    }
  }
  return ret
})
