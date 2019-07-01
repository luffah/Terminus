({
  img: 'man_sage',
  states: {
    less: (re, o, e) => {
      o.unsetCmdEvent(e)
      Builtin.unhide('exit')
      $mountain.newItem('man', { img: 'item_manuscript.png',
        states: {
          less: (re, it, e) => {
            it.unsetCmdEvent(e)
            addGroup('man')
          },
          less_done: (re, it, e) => {
            it.unsetCmdEvent(e)
            playMusic('yourduty', { loop: true })
          }
        }
      })
    },
    less_done: (re, o) => {
      o.disappear()
    }
  }
})
