Command.def('cp', [ARGT.file, ARGT.filenew], function () { // event arg -> destination item
  const task = this
  const [args, sys, env] = [task.args, task.io, task.env]

  if (args.length !== 2) {
    return { stderr: _('incorrect_syntax'), code: 1 }
  } else {
    var src = ctx.traversee(args[0])
    var dest = ctx.traversee(args[1])
    if (src.item) {
      if (dest.item) {
        return _stderr(_('tgt_already_exists', [dest.item_name]))
      } else if (dest.room) {
        const nut = src.item.copy(dest.item_name)
        dest.room.addItem(nut)
        nut.fire(env, 'cp', args, 1)
        src.item.fire(env, 'cp', args, 0)
        dest.room.fire(env, 'cp', args, 1)

        return {
          fireables: [[src.item, 0], [nut, 1]],
          stdout: _('cmd_cp_copied', args)
        }
      }
    }
    return { stderr: _('cmd_cp_unknown') }
  }
})
