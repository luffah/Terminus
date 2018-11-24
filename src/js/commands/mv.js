Command.def('mv', [ARGT.strictfile, ARGT.file], function (args, ctx, vt) { // event arg -> object (source)
  var ret = []
  var src
  var item_idx
  var dest = ctx.traversee(args[args.length - 1])
  console.log(dest, args)
  if (dest.item_name && args.length > 2) {
    ret.push(_stderr(_('cmd_mv_flood')))
  } else {
    var retfireables = []; var rename; var overwritten
    for (let i = 0; i < (args.length - 1); i++) {
      src = ctx.traversee(args[i])
      log('tryhook')
      let hret = src.item.tryhook(['mv', args[i],args[args.length - 1]])
      if (hret){
        if (hret.ret) ret.push(hret.ret)
        if (hret.pass) continue
      }
      if (src.room) {
        if (src.item && dest.room) {
          rename = (dest.item_name && (src.item_name !== dest.item_name))
          overwritten = (dest.item)
          if (!dest.room.ismod('w', ctx)) {
            ret.push(_stderr(_('permission_denied') + ' ' + _('cmd_mv_dest_fixed')))
            src.item.fire_event(vt, 'permission_denied', args, 0)
          } else if (src.item_idx > -1) {
            if (src.room.ismod('w', ctx)) {
              if (overwritten) {
                dest.room.removeItemByIdx(dest.item_idx)
              }
              if (rename) {
                src.item.name = dest.item_name
              }
              src.room.fire_event(vt, 'mv', [args[i], args[args.length - 1]], 0)
              if (src.room.uid !== dest.room.uid) {
                dest.room.addItem(src.item)
                src.room.removeItemByIdx(src.item_idx)
                src.item.fire_event(vt, 'mv_outside', [args[i], args[args.length - 1]], 0)
                ret.push(_stdout(_('cmd_mv_done', [args[i], args[args.length - 1]])))
              } else {
                src.item.fire_event(vt, 'mv_local', [args[i], args[args.length - 1]], 0)
              }
              src.item.fire_event(vt, 'mv', [args[i], args[args.length - 1]], 0)
              if (rename) {
                src.item.fire_event(vt, 'mv_name', args, 0)
                if (!overwritten) {
                  ret.push(_stdout(_('cmd_mv_name_done', [args[i], args[args.length - 1]])))
                }
              }
              if (overwritten) {
                ret.push(_stdout(_('cmd_mv_overwrite_done', [args[i], args[args.length - 1]])))
              }
              retfireables.push([src.item, 0])
            } else {
              ret.push(_stderr(_('permission_denied') + ' ' + _('cmd_mv_fixed')))
              src.item.fire_event(vt, 'permission_denied', args, 0)
            }
          }
        } else if (!src[2]) {
          // got directory
          // TODO mv dir
        }
      } else {
        // got nothing
        ret.push(_stderr(_('cmd_mv_no_file', [args[i]])))
      }
    }
    return cmd_done(vt, retfireables, ret, 'mv', args)
    //      return _("cmd_mv_invalid");
  }
  return ret
})
