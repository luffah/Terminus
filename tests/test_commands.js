addTest(function (next) {
  console.log('TEST INIT')
  vt.setContext(new Context({ 'sure': { groups: ['user'], address: 'DTC' } }, 'sure', $home, {}))
  vt.enable_input()
  next()
})

addTest(function (next) {
  vt.context.currentuser = 'ls'
  vt.set_line('ls')
  vt.enter()
  setTimeout(next, 1000)
})

addTest(function (next) {
  console.log('TEST CMD GREP')
  vt.context.currentuser = 'grep'
  vt.set_line('grep cd Palourde')
  vt.enter()
  setTimeout(next, 1000)
})

addTest(function (next) {
  vt.context.currentuser = 'cat'
  vt.set_line('cat BoisDesLutins/Panneau;cat BoisDesLutins/Panneau')
  vt.enter()
  setTimeout(next, 1000)
})
addTest(function (next) {
  vt.context.currentuser = 'sure'
  vt.context.addGroup('dir')
  setTimeout(next, 1000)
})
