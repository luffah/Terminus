({
  img: 'grep',
  cmd: 0,
  states: {
    less: (re, o, e) => {
      vt.ctx.addGroup('grep')
      o.name = 'grep'
      o.nopo = ['name']
      vt.ctx.v.PATH.push(o.room)
      learn(vt, 'grep', re)
    }
  }
})
