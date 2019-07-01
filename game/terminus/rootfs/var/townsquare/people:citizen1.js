({
  img: 'citizen1',
  v: 1,
  states: {
    less_done: (re, o, e) => {
      o.setCmdEvent(e, 'talk')
      o.setPoDelta('_')
    },
    talk: (re, o) => {
      o.setTextIdx(o.v++)
    }
  }
})
