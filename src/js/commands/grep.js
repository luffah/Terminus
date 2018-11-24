Command.def('grep', [ARGT.pattern, ARGT.strictfile], function (args, ctx, vt) {
  var word_to_find = args[0]
  var ret = []
  for (var i = 1; i < args.length; i++) {
    var tgt = ctx.traversee(args[1])
    if (tgt.item) {
      let hret = cwd.tryhook('grep', [word_to_find,args[i]])
      if (hret){
        if (hret.ret) ret.push(hret.ret)
        if (hret.pass) continue
      }
      var return_arr = tgt.item.text.split('\n').filter(function (line) { return (line.indexOf(word_to_find) > 0) })
      ret.push(_stdout(return_arr.join('\n')))
    } else {
      ret.push(_stderr(_('item_not_exists', [args[1]])))
    }
  }
  return ret
})
