function prtStat(r, path){
  return t('tr',
    t('td', r.link ? 'link ' : (r instanceof Room ? 'dir  ':'file ' ) )  +
    t('td', r.mod.stringify() ) +
    t('td', r.owner) +
    t('td', r.group) +
    t('td', (path || '') + '/' + (r.room ? r.id : '') ) +
    t('td', '"' + r.toString() + '"' ) +
    t('td', (r.link ? ' --> ' + r.link.id : ''))
  )
}

function listFiles (room, path) {
  let text = ''
  let lFiles = (room, path) => {
    room.children.forEach(r => {
      text += prtStat(r, path)
      lFiles(r, (path || '') + '/' + r.id)
    })
    room.items.forEach(i => { text += prtStat(i, path) })
  }
  text += prtStat(room)
  lFiles(room, path)
  return t('table',t('tbody',text))
}

addTest(function (next) {
  vt.setContext(new Context({ 'sure': { groups: ['user'], address: 'DTC' } }, 'sure', $home, {}))
  vt.context.addGroup('dir')
  vt.context.addGroup('pwd')
  vt.context.addGroup('touch')
  $root.chmod('777')
  let link = $home.newLink('link',
   $root.newRoom('opt', {mod:777}).newRoom('linktarget', {mod:777})
  )
  $root.newItem('a')
  $linktarget.newItem('test')
  link.newItem('test')
  vt.show_msg(
    listFiles($root), {cls:'logging'}
  )
  vt.enable_input()
  next()
})

addTest(function (next) {
  vt.set_line('ls -l; cd link; ls')
  vt.enter()
  setTimeout(next, 1000)
})
