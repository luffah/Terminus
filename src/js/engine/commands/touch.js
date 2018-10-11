_defCommand('touch', [ARGT.filenew], function (args, ctx, vt) {
  var cwd = ctx.room
  if (args.length < 1) {
    return _stdout(_('cmd_touch_nothing'))
  } else {
    var createdItemsString = ''
    for (var i = args.length - 1; i >= 0; i--) {
      if (cwd.getItemFromName(args[i])) {
        return _stderr(_('tgt_already_exists', [args[i]]))
      } else if (args[i].length > 0) {
        cwd.addItem(new Item(args[i], _('item_intro', [args[i]])))
        createdItemsString += args[i]
        cwd.fire_event(vt, 'touch', args, i)
      }
    }
    if (createdItemsString === '') {
      return _stderr(_('cmd_touch_none'))
    }
    return _stdout(_('cmd_touch_created', [createdItemsString]))
  }
})
