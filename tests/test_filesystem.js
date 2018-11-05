addTest(function (next) {
  vt.setContext(new Context({ 'sure': { groups: ['user'], address: 'DTC' } }, 'sure', $home, {}))
  vt.context.addGroup('dir')
  $home.concatLink('link',
    $root.newRoom('opt').newRoom('linktarget')
  )
  vt.enable_input()
  next()
})

addTest(function (next) {
  vt.set_line('ls')
  vt.enter()
  setTimeout(next, 1000)
})
