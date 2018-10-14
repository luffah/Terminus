function printLS (room, render_classes) {
  var ret = ''; var pics = {}; var i
  render_classes = render_classes || { item: 'item', people: 'people', subroom: 'inside-room' }
  if ((room.children.length > 0) || !room.isRoot) {
    tmpret = ''
    for (i = 0; i < room.children.length; i++) {
      tmpret += span('color-room', room.children[i].toString() + '/') + '\n\t'
      if (room.children[i].picture && room.children[i].picture.shown_as_item) {
        room.children[i].picture.setOneShotRenderClass(render_classes.subroom)
        pics['room-' + i] = room.children[i].picture
      }
    }
    ret += _('directions',
      ['\t' + (room.isRoot ? '' : span('color-room', '..') + ' (revenir sur tes pas)\n\t') + tmpret ]
    ) + '\t\n'
  }
  var items = room.items.filter(function (o) { return !o.people })
  var peoples = room.items.filter(function (o) { return o.people })
  for (i = 0; i < peoples.length; i++) {
    if (peoples[i].picture && peoples[i].picture.shown_in_ls) {
      peoples[i].picture.setOneShotRenderClass(render_classes.people)
      pics['peoples-' + i] = peoples[i].picture
    }
  }
  if (peoples.length > 0) {
    ret += _('peoples', ['\t' + peoples.map(function (n) { return span('color-people', n.toString()) }).join('\n\t')]) + '\t\n'
  }
  for (i = 0; i < items.length; i++) {
    if (items[i].picture && items[i].picture.shown_in_ls) {
      items[i].picture.setOneShotRenderClass(render_classes.item)
      pics['item-' + i] = items[i].picture
    }
  }
  if (items.length > 0) {
    ret += _('items', ['\t' + items.map(function (n) { return span('color-item', n.toString()) }).join('\n\t')]) + '\t\n'
  }
  return { stdout: ret, pics: pics }
}

_defCommand('ls', [ARGT.dir], function (args, ctx, vt) {
  var pic
  var cwd = ctx.room
  console.log(cwd)

  if (args.length > 0) {
    var room = cwd.traversee(args[0]).room
    if (room) {
      if ('ls' in room.cmd_hook) {
        hret = room.cmd_hook['ls'](args)
        if (d(hret.ret, false)) return hret.ret
      }
      if (!room.readable) {
        return _('permission_denied') + ' ' + _('room_unreadable')
      }
      if (room.children.length === 0 && room.items.length === 0) {
        prtls = { pics: {}, stderr: _('room_empty') }
      } else {
        prtls = printLS(room)
      }
      pic = room.picture.copy()
      pic.addChildren(prtls.pics)
      pic.setOneShotRenderClass('room')
      vt.push_img(pic) // Display image of room
      return prtls
    } else {
      return { stderr: _('room_unreachable') }
    }
  } else {
    if ('ls' in cwd.cmd_hook) {
      hret = cwd.cmd_hook['ls'](args)
      if (d(hret.ret, false)) return hret.ret
    }
    prtls = printLS(cwd)
    pic = cwd.picture.copy()
    pic.addChildren(prtls.pics)
    pic.setOneShotRenderClass('room')
    vt.push_img(pic) // Display image of room
    return prtls
  }
})
