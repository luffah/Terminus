_defCommand('grep', [ARGT.pattern, ARGT.strictfile], function (args, ctx, vt) {
  var word_to_find = args[0]
  var ret = []
  for (var i = 1; i < args.length; i++) {
    var tgt = ctx.room.traversee(args[1])
    if (tgt.item) {
      if ('grep' in tgt.item.cmd_hook) {
        hret = tgt.item.cmd_hook['grep']([word_to_find,args[i]])
        if (def(hret)){
        if (d(hret.ret, false)) ret.push(hret.ret)
        if (d(hret.pass, false)) continue
        }
      }
      var return_arr = tgt.item.text.split('\n').filter(function (line) { return (line.indexOf(word_to_find) > 0) })
      ret.push(_stdout(return_arr.join('\n')))
    } else {
      ret.push(_stderr(_('item_not_exists', [args[1]])))
    }
  }
  return ret
})
