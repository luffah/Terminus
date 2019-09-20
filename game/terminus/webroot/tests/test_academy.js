addTest(function (next) {
  console.log('TEST INIT')
  vt.setContext(new Context({ sure: { groups: ['user', 'dir', 'cat'], address: 'DTC' } }, 'sure', $home, {}))
  $home.owner = vt.context.currentuser
  load_soundbank(vt)
  loadLevel1()
  vt.enable_input()
  next()
})

addTest(function (next) {
  console.log('TEST ACADEMY LEVEL')
  vt.set_line('cat BoisDesLutins/AcadémieDesBots/Cours/Professeur')
  vt.enter()
  vt.set_line('cd BoisDesLutins/AcadémieDesBots/SalleDEntrainement/')
  vt.enter()
  vt.set_line('mv Pilier* ~/')
  vt.enter()
  setTimeout(next, 2000)
})

addTest(function (next) {
  vt.set_line('ls')
  vt.enter()
  setTimeout(next, 2000)
})

addTest(function (next) {
  vt.set_line('cd ~/')
  vt.enter()
  vt.set_line('ls BoisDesLutins/AcadémieDesBots')
  vt.enter()
  setTimeout(next, 1000)
})

addTest(function (next) {
  vt.set_line('cd BoisDesLutins')
  vt.enter()
  vt.set_line('cat *')
  vt.enter()
  setTimeout(next, 1000)
})

addTest(function (next) {
  vt.set_line('cd ../Prairie')
  vt.enter()
  vt.set_line('cat *')
  vt.enter()
  setTimeout(next, 1000)
})

addTest(function (next) {
  vt.set_line('cat Poney')
  vt.enter()
  setTimeout(next, 1000)
})

addTest(function (next) {
  vt.set_line('cd Montagnes')
  vt.enter()
  setTimeout(next, 1000)
})

addTest(function (next) {
  vt.set_line('cat VieilHomme')
  vt.enter()
  setTimeout(next, 1000)
})

addTest(function (next) {
  vt.set_line('cat Manuscrit')
  vt.enter()
  setTimeout(next, 1000)
})

addTest(function (next) {
  vt.set_line('cd Cave/SombreCorridor/PièceHumide/')
  vt.enter()
  setTimeout(next, 1000)
})

addTest(function (next) {
  vt.set_line('mv * PetitCrevasse')
  vt.enter()
  setTimeout(next, 1000)
})

addTest(function (next) {
  vt.set_line('cd Tunnel')
  vt.enter()
  setTimeout(next, 1000)
})
