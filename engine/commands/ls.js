Command.def('ls', [ARGT.dir], function (args, env, sys) {

  function optL(room, path, showhidden, recursive) {
    function prtStat (r, path, hidden) {
      return [
        r.link ? 'link' : (r instanceof Room ? 'dir' : 'file '),
        r.mod.stringify(),
        r.owner,
        r.group,
        (hidden ? path : (path || '') + '/' + (r.room ? r.id : '')),
        '"' + r.toString() + '"',
        r.link ? ' --> ' + r.link.id : ''
      ]
    }

    let tab = []
    if (showhidden) tab.push(prtStat(room, path, true))
    function lFiles (room, path) {
      console.log(path)
      room.tgt.children.forEach(r => {
        tab.push(prtStat(r, path))
        if (recursive) lFiles(r, (path || '') + '/' + r.id)
      })
      room.tgt.items.forEach(i => tab.push(prtStat(i, path)))
    }
    lFiles(room, path)
    console.log(tab)
    return table_to_printf(tab)
  }

  function main (room, path, opt) {
    if (!room.ismod('r', env)) return { stderr:  _('permission_denied') + ' ' + _('room_unreadable') }
    if (!room.checkAccess(env)) return { stderr: _('permission_denied') + ' ' + _('room_forbidden') }
    if (room.isEmpty()) return { render: room, stderr: _('room_empty') }
    if (opt.l) return { stdout: optL(room, path, opt.a) }
    let ret = ''

    let doors = room.getDoors()
    let items = room.getItems()
    let peoples = room.getPeoples()

    let tmpret = ''
    doors.forEach((f, i) => { tmpret += _span(f.toString() + '/', 't-room') + '\n\t' })
    if (doors.length || room.isRoot()) {
      ret += _('ls_title_directions', ['\n\t' + (room.isRoot() ? '' : ( _span('..', 't-room') + (room.is(env.get.HOME) ? '' : ' (revenir sur tes pas)') + '\n\t')) + tmpret ]
      ) + '\t\n'
    }

    if (peoples.length > 0) { ret += _('ls_title_peoples', ['\n\t' + peoples.map((n) => _span(n.toString(), 't-people')).join('\n\t')]) + '\t\n' }
    if (items.length > 0) { ret += _('ls_title_items', ['\n\t' + items.map(function (n) { return _span(n.toString(), 't-item') }).join('\n\t')]) + '\t\n' }
    return { stdout: ret, render: new RenderTree(room, doors.concat(items, peoples)) }
  }

  let [files, opts] = Command.tools.parseArgs(args)
  if (files.length) {
    let room = env.traversee(files[0][0]).room 
    if (room) {
      let hret = room.tryhook('ls', files)
      if (hret && hret.ret) return hret.ret
      return main(room, files[0], opts)
    } else {
      sys.stderr.write(_('room_unreachable'))
    }
  } else {
    let hret = env.cwd.tryhook('ls', args)
    if (hret && hret.ret) return hret.ret
    return main(env.cwd, '.', opts)
  }
})
