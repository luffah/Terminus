({
  img: 'artisan',
  var: 0, // artisan
  states: {
    less: (re, o, e) => {
      vt.ctx.addGroup('touch')
      learn(vt, 'touch', re)
      o.unsetCmdEvent(e)
      state.saveCookie()
    }
  }
})
