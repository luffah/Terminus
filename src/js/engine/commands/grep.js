_defCommand('grep', [ARGT.pattern, ARGT.strictfile], function (args, ctx, vt) {
  var word_to_find = args[0]
  //      var item=dir.getItemFromName(args[1]);
  var tgt = ctx.room.traversee(args[1])
  if (tgt.item) {
    var item_to_find_in_text = tgt.item.cmd_text.less
    var line_array = item_to_find_in_text.split('\n')
    var return_arr = line_array.filter(function (line) { return (line.indexOf(word_to_find) > 0) })
    return _stdout(return_arr.join('\n'))
  } else {
    return _stderr(_('item_not_exists', args))
  }
})
