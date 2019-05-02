({
  states: {
    less: function (re) {
      vt.ctx.addGroup('sudo')
      learn(vt, 'sudo', re)
    }
  }
})
