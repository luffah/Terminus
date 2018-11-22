function prtStat (r, path, force) {
  return t('tr',
    t('td', r.link ? 'link ' : (r instanceof Room ? 'dir  ' : 'file ')) +
    t('td', r.mod.stringify()) +
    t('td', r.owner) +
    t('td', r.group) +
    t('td', (force ? path : (path || '') + '/' + (r.room ? r.id : ''))) +
    t('td', '"' + r.toString() + '"') +
    t('td', (r.link ? ' --> ' + r.link.id : ''))
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
  return t('table', t('tbody', text))
}

function printLS (room, path, opt, ctx) {
  if (opt.l) {
    return listFiles(room, path, opt.a)
  }
  var ret = ''; var pics = {}; var i
  let tmpret = ''
  let render_classes = { item: 'item', people: 'people', room: 'inside-room' }
  let prerender = (t, f, i) => {
    if (f.picture && f.pic_shown_in_ls && (!(t == 'room') || f.pic_shown_as_item)) {
      let p = new Pic(f)
      p.tmpcls = render_classes[t]
      pics[t + '-' + i] = p
    }
  }
  let doors = room.getDoors()
  let items = room.getItems()
  let peoples = room.getPeoples()
  doors.forEach((f, i) => {
    tmpret += span('color-room', f.toString() + '/') + '\n\t'
    prerender('room', f, i)
  })
  if (doors.length || room.isRoot()) {
    ret += _('directions',
      ['\t' + (room.isRoot() ? '' : (
        span('color-room', '..') + (room.is(ctx.h.v.HOME) ? '' : ' (revenir sur tes pas)') + '\n\t'
      )) + tmpret ]
    ) + '\t\n'
  }
  peoples.forEach((f, i) => prerender('people', f, i))
  if (peoples.length > 0) {
    ret += _('peoples', ['\t' + peoples.map((n) => span('color-people', n.toString())).join('\n\t')]) + '\t\n'
  }
  items.forEach((f, i) => prerender('item', f, i))
  if (items.length > 0) {
    ret += _('items', ['\t' + items.map(function (n) { return span('color-item', n.toString()) }).join('\n\t')]) + '\t\n'
  }
  return { stdout: ret, pics: pics }
}

Command.def('ls', [ARGT.dir], function (args, ctx, vt) {
  let pic
  let args_indexed = args.map((s, i) => [s, i])
  let opt = _getOpts(args_indexed.filter((s) => s[0][0] == '-'))
  let files = args_indexed.filter((s) => s[0][0] != '-')
  if (files.length) {
    let room = ctx.traversee(files[0][0]).room
    if (room) {
      if ('ls' in room.cmd_hook) {
        hret = room.cmd_hook['ls'](files)
        if (d(hret.ret, false)) return hret.ret
      }
      if (!room.ismod('r', ctx)) {
        return _('permission_denied') + ' ' + _('room_unreadable')
      }
      if (!room.checkAccess(ctx)) {
        return _('permission_denied') + ' ' + _('room_forbidden')
      }
      if (room.isEmpty()) {
        prtls = { pics: {}, stderr: _('room_empty') }
      } else {
        prtls = printLS(room, files[0], opt, ctx)
      }
      pic = new Pic(room)
      pic.addChildren(prtls.pics)
      pic.tmpcls = 'room'
      vt.push_img(pic) // Display image of room
      return prtls
    } else {
      return { stderr: _('room_unreachable') }
    }
  } else {
    let cwd = ctx.h.r
    if ('ls' in cwd.cmd_hook) {
      hret = cwd.cmd_hook['ls'](args)
      if (d(hret.ret, false)) return hret.ret
    }
    prtls = printLS(cwd, '.', opt, ctx)
    pic = new Pic(cwd)
    pic.addChildren(prtls.pics)
    pic.tmpcls = 'room'
    vt.push_img(pic) // Display image of room
    return prtls
  }
})
