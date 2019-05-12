Command.def('touch', [ARGT.filenew], function (args, ctx, vt) {
  var cwd = ctx.h.r
  if (args.length < 1) {
    return _stdout(_('cmd_touch_nothing'))
  } else {
    var createdItemsString = ''
    let ret = [] // FIXME : ret shall be returned
    for (var i = args.length - 1; i >= 0; i--) {
      let hret = cwd.tryhook('touch', [args[i]])
      if (hret) {
        if (def(hret.ret)) ret.push(hret.ret)
        if (hret.pass) continue
      }
      if (cwd.getItemFromName(args[i])) {
        return _stderr(_('tgt_already_exists', [args[i]]))
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
      return _stderr(_('cmd_touch_none'))
    }
    return _stdout(_('cmd_touch_created', [createdItemsString]))
  }
})