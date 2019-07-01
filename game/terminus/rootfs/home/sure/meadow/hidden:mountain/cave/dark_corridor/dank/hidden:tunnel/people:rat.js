({
  img: 'rat',
  v: 0,
  pic_shown_in_ls: false,
  states: {
    less_done: (re, o) => {
      o.setCmdEvent('less_done', 'ratDial')
      o.poDelta = '_identified'
    },
    ratDial: (re, o) => {
      o.textIdx = ++o.v
    }
  }
})
