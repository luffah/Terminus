Command.def('touch', [ARGT.filenew], function () {
  const task = this
  const [args, sys, env] = [task.args, task.io, task.env]

  if (args.length < 1) {
    return { stdout: _('cmd_touch_nothing') }
  } else {
    var createdItemsString = ''
    const ret = [] // FIXME : ret shall be returned
    for (var i = args.length - 1; i >= 0; i--) {
      const hret = cwd.tryhook('touch', [args[i]])
      if (hret) {
        if (def(hret.ret)) ret.push(hret.ret)
        if (hret.pass) continue
      }
      if (cwd.getItemFromName(args[i])) {
        return { stderr: _('tgt_already_exists', [args[i]]) }
      } else if (args[i].length > 0) {
        cwd.addItem(new Item({
          name: args[i],
          text: _('item_intro', [args[i]])
        }))
        createdItemsString += args[i]
        cwd.fire(vt, 'touch', args, i)
      }
    }
    if (createdItemsString === '') {
      return { stderr: _('cmd_touch_none') }
    }
    return { stdout: _('cmd_touch_created', [createdItemsString]) }
  }
})
