function prtStat (r, path, force) {
  return [
    r.link ? 'link ' : (r instanceof Room ? 'dir  ' : 'file '),
    r.mod.stringify(),
    r.owner,
    r.group,
    (force ? path : (path || '') + '/' + (r.room ? r.id : '')),
    '"' + r.toString() + '"',
    r.link ? ' --> ' + r.link.id : ''
  ]
}

function listFiles (room, path, showhidden, recursive) {
  let tab = []
  let lFiles = (room, path) => {
    room.tgt.children.forEach(r => {
      tab.push(prtStat(r, path))
      if (recursive) lFiles(r, (path || '') + '/' + r.id)
    })
    room.tgt.items.forEach(i => tab.push(prtStat(i, path)))
  }
  if (showhidden) tab.push(prtStat(room, path, true))
  lFiles(room, path)
  return table(tab)
}

function printLS (room, path, opt, vt, ctx) {
  if (opt.l) {
    return listFiles(room, path, opt.a)
  }
  let ret = ''
  let pic = {}
  let prerender = (t, f, i) => {
    if (f.img && f.pic_shown_in_ls && ((t !== 'room') || f.pic_shown_as_item)) {
      pic[t + '-' + i] = vt.mkImg(f, { tmpcls: t })
    }
  }
  let doors = room.getDoors()
  let items = room.getItems()
  let peoples = room.getPeoples()

  let tmpret = ''
  doors.forEach((f, i) => {
    tmpret += span(f.toString() + '/', 't-room') + '\n\t'
    prerender('room', f, i)
  })
  if (doors.length || room.isRoot()) {
    ret += _('ls_title_directions',
      ['\n\t' + (room.isRoot() ? '' : (
        span('..', 't-room') + (room.is(ctx.h.v.HOME) ? '' : ' (revenir sur tes pas)') + '\n\t'
      )) + tmpret ]
    ) + '\t\n'
  }

  peoples.forEach((f, i) => prerender('people', f, i))
  if (peoples.length > 0) {
    ret += _('ls_title_peoples', ['\n\t' + peoples.map((n) => span(n.toString(), 't-people')).join('\n\t')]) + '\t\n'
  }
  items.forEach((f, i) => prerender('item', f, i))
  if (items.length > 0) {
    ret += _('ls_title_items', ['\n\t' + items.map(function (n) { return span(n.toString(), 't-item') }).join('\n\t')]) + '\t\n'
  }
  return { stdout: ret, pic: pic }
}

Command.def('ls', [ARGT.dir], function (args, ctx, vt) {
  let prtls
  let indexed = args.map((s, i) => [s, i])
  let opt = _getOpts(indexed.filter((s) => s[0][0] === '-'))
  let files = indexed.filter((s) => s[0][0] !== '-')
  if (files.length) {
    let room = ctx.traversee(files[0][0]).room
    if (room) {
      let hret = room.tryhook('ls', files)
      if (hret && hret.ret) return hret.ret
      if (!room.ismod('r', ctx)) {
        return _('permission_denied') + ' ' + _('room_unreadable')
      }
      if (!room.checkAccess(ctx)) {
        return _('permission_denied') + ' ' + _('room_forbidden')
      }
      if (room.isEmpty()) {
        prtls = { pic: {}, stderr: _('room_empty') }
      } else {
        prtls = printLS(room, files[0], opt, vt, ctx)
      }
      prtls.pic = vt.mkImg(room, { children: prtls.pic, tmpcls: 'room' })
      return prtls
    } else {
      return { stderr: _('room_unreachable') }
    }
  } else {
    let cwd = ctx.h.r
    let hret = cwd.tryhook('ls', args)
    if (hret && hret.ret) return hret.ret
    prtls = printLS(cwd, '.', opt, vt, ctx)
    prtls.pic = vt.mkImg(cwd, { children: prtls.pic, tmpcls: 'room' })
    return prtls
  }
})
