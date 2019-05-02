({
  img: 'lady',
  v: 1,
  states: {
    less_done: function (re, o, e) {
      o.setTextIdx(o.v++)
    }
  }
})
