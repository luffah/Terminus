Command.def('unzip', [ARGT.file.concat(['*.zip'])], function (args, ctx, vt) {
  if (args.length === 1) {
    const tr = ctx.traversee(args[0])
    if (tr.item && tr.room.ismod('w', ctx)) {
      tr.item.fire(vt, 'unzip', args, 0)
      return { stdout: '' }
    } else {
      return { stderr: _('item_cmd_unknow', 'unzip') }
    }
  }
  return { stderr: _('incorrect_syntax') }
})
