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
  vt.set_line('ls BoisDesLutins/')
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
