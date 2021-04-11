Command.def('mv', [ARGT.strictfile, ARGT.file], function () {
  const task = this
  const [args, sys, env] = [task.args, task.io, task.env]

  let src
  const dest = env.traversee(args[args.length - 1])
  console.log(dest, args)
  if (dest.item_name && args.length > 2) {
    sys.stderr.write(_('cmd_mv_flood'))
  } else {
    const fireables = []; let rename; let overwritten
    for (let i = 0; i < (args.length - 1); i++) {
      src = env.traversee(args[i])
      const hret = src.item.tryhook(['mv', args[i], args[args.length - 1]])
      if (hret) {
        if (hret.ret) sys.push(hret.ret)
        if (hret.pass) continue
      }
      if (src.room) {
        if (src.item && dest.room) {
          rename = (dest.item_name && (src.item_name !== dest.item_name))
          overwritten = (dest.item)
          if (!dest.room.ismod('w', env)) {
            sys.push({ stderr: _('permission_denied') + ' ' + _('cmd_mv_dest_fixed') })
            src.item.fire(sys, 'permission_denied', args, 0)
          } else if (src.item_idx > -1) {
            if (src.room.ismod('w', env)) {
              if (overwritten) {
                dest.room.removeItemByIdx(dest.item_idx)
              }
              if (rename) {
                src.item.name = dest.item_name
              }
              src.room.fire(sys, 'mv', [args[i], args[args.length - 1]], 0)
              if (src.room.uid !== dest.room.uid) {
                dest.room.addItem(src.item)
                src.room.removeItemByIdx(src.item_idx)
                src.item.fire(sys, 'mv_outside', [args[i], args[args.length - 1]], 0)
                sys.push({ stdout: _('cmd_mv_done', [args[i], args[args.length - 1]]) })
              } else {
                src.item.fire(sys, 'mv_local', [args[i], args[args.length - 1]], 0)
              }
              src.item.fire(sys, 'mv', [args[i], args[args.length - 1]], 0)
              if (rename) {
                src.item.fire(sys, 'mv_name', args, 0)
                if (!overwritten) {
                  sys.push({ stdout: _('cmd_mv_name_done', [args[i], args[args.length - 1]]) })
                }
              }
              if (overwritten) {
                sys.push({ stdout: _('cmd_mv_overwrite_done', [args[i], args[args.length - 1]]) })
              }
              fireables.push([src.item, 0])
            } else {
              sys.push({ stderr: _('permission_denied') + ' ' + _('cmd_mv_fixed') })
              src.item.fire(sys, 'permission_denied', args, 0)
            }
          }
        } else if (!src[2]) {
          // got directory
          // TODO mv dir
        }
      } else {
        // got nothing
        sys.push({ stderr: _('cmd_mv_no_file', [args[i]]) })
      }
    }
    return { fireables: fireables }
  }
  return ret
}).hookable = false
