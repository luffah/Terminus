({
  img: 'vimbook',
  states: {
    less: (re, o) => {
      if (!re) { flash(1600, 1000); vt.rmCurrentImg(2650) }
      o.disappear()
    }
  }
})
