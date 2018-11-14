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
