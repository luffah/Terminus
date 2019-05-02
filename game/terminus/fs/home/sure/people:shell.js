({ // TODO: shell is the program your are using ...
  v: 0,
  events: { exec_done: 'less_done' },
  states: {
    less_done: (re, o, e) => {
      o.textIdx = (++o.v % 7)
    }
  }
})
