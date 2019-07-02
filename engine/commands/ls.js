Command.def('ls', [ARGT.dir], function (args, env, sys) {

  function optL(room, path, showhidden) {
    let tab = []
    let list = room.find(0,1)
    if (showhidden) {
      list.push(room)
    } else {
      list = list.filter((f) => !re.hidden.test(f.name))
    }
    for (let f of list){
      tab.push([
        f.link ? 'link' : (f instanceof Room ? 'dir' : 'file '),
        f.mod.stringify(),
        f.owner,
        f.group,
        f.relativepath(room),
        f.link ? ' --> ' + f.link.path : ''
      ])
    }
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
