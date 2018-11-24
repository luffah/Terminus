function prtStat (r, path, force) {
  return tr(
    td(r.link ? 'link ' : (r instanceof Room ? 'dir  ' : 'file ')) +
    td(r.mod.stringify()) +
    td(r.owner) +
    td(r.group) +
    td((force ? path : (path || '') + '/' + (r.room ? r.id : ''))) +
    td('"' + r.toString() + '"') +
    td((r.link ? ' --> ' + r.link.id : ''))
  )
}

function listFiles (room, path, showhidden, recursive) {
  let text = ''
  let lFiles = (room, path) => {
    room.tgt.children.forEach(r => {
      text += prtStat(r, path)
      if (recursive) lFiles(r, (path || '') + '/' + r.id)
    })
    room.tgt.items.forEach(i => { text += prtStat(i, path) })
  }
  if (showhidden) text += prtStat(room, path, true)
  lFiles(room, path)
  return table(text)
}

function printLS (room, path, opt, ctx) {
  if (opt.l) {
    return listFiles(room, path, opt.a)
  }
  let ret = ''
  let pic = {}
  let prerender = (t, f, i) => {
    if (f.img && f.pic_shown_in_ls && ((t !== 'room') || f.pic_shown_as_item)) {
      pic[t + '-' + i] = new Pic(f, {tmpcls: t})
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
    ret += _('directions',
      ['\t' + (room.isRoot() ? '' : (
        span('..', 't-room') + (room.is(ctx.h.v.HOME) ? '' : ' (revenir sur tes pas)') + '\n\t'
      )) + tmpret ]
    ) + '\t\n'
  }

  peoples.forEach((f, i) => prerender('people', f, i))
  if (peoples.length > 0) {
    ret += _('peoples', ['\t' + peoples.map((n) => span(n.toString(), 't-people')).join('\n\t')]) + '\t\n'
  }
  items.forEach((f, i) => prerender('item', f, i))
  if (items.length > 0) {
    ret += _('items', ['\t' + items.map(function (n) { return span(n.toString(), 't-item') }).join('\n\t')]) + '\t\n'
  }
  return { stdout: ret, pic: pic }
}

Command.def('ls', [ARGT.dir], function (args, ctx, vt) {
  let pic
  let args_indexed = args.map((s, i) => [s, i])
  let opt = _getOpts(args_indexed.filter((s) => s[0][0] == '-'))
  let files = args_indexed.filter((s) => s[0][0] != '-')
  if (files.length) {
    let room = ctx.traversee(files[0][0]).room
    if (room) {
      let hret = room.tryhook('ls',files)
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
        prtls = printLS(room, files[0], opt, ctx)
      }
      prtls.pic = new Pic(room, {children:prtls.pic, tmpcls:'room'})
      return prtls
    } else {
      return { stderr: _('room_unreachable') }
    }
  } else {
    let cwd = ctx.h.r
    let hret = cwd.tryhook('ls',args)
    if (hret && hret.ret) return hret.ret
    prtls = printLS(cwd, '.', opt, ctx)
    prtls.pic = new Pic(cwd, {children:prtls.pic, tmpcls:'room'})
    return prtls
  }
})
