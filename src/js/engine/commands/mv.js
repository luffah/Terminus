_defCommand('mv', [ARGT.strictfile, ARGT.file], function (args, ctx, vt) { // event arg -> object (source)
  console.log(args)
  var ret = []
  var src
  var item_idx
  var cwd = ctx.room
  var dest = cwd.traversee(args[args.length - 1])
  if (dest.item_name && args.length > 2) {
    ret.push(_stderr(_('cmd_mv_flood')))
  } else {
    var retfireables = []; var rename; var overwritten
    for (var i = 0; i < (args.length - 1); i++) {
      src = cwd.traversee(args[i])
      if (src.room) {
        if (src.item && dest.room) {
          rename = (dest.item_name && (src.item_name !== dest.item_name))
          overwritten = (dest.item)
          if (!dest.room.writable) {
            ret.push(_stderr(_('permission_denied') + ' ' + _('cmd_mv_dest_fixed')))
          } else if (src.item_idx > -1) {
            if (src.room.writable) {
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
                if ('mv' in src.item.cmd_text) {
                  ret.push(_stdout(src.item.cmd_text.mv))
                } else {
                  ret.push(_stdout(_('cmd_mv_done', [args[i], args[args.length - 1]])))
                }
              } else {
                src.item.fire_event(vt, 'mv_local', [args[i], args[args.length - 1]], 0)
              }
              src.item.fire_event(vt, 'mv', [args[i], args[args.length - 1]], 0)
              if (rename) {
                src.item.fire_event(vt, 'mv_name', args, 0)
                if ('mv_name' in src.item.cmd_text) {
                  ret.push(_stdout(src.item.cmd_text.mv_name))
                } else if (!overwritten) {
                  ret.push(_stdout(_('cmd_mv_name_done', [args[i], args[args.length - 1]])))
                }
              }
              if (overwritten) {
                ret.push(_stdout(_('cmd_mv_overwrite_done', [args[i], args[args.length - 1]])))
              }
              retfireables.push([src.item, 0])
            } else if ('mv' in src.item.cmd_text) {
              ret.push(_stdout(src.item.cmd_text.mv))
            } else {
              ret.push(_stderr(_('permission_denied') + ' ' + _('cmd_mv_fixed')))
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
    return cmd_done(vt, retfireables, new ReturnSequence(ret), 'mv', args)
    //      return _("cmd_mv_invalid");
  }
  return ret.join('\n')
})
