({
  img: 'market',
  mod: 777,
  v: [],
  states: {
    rmSold: (re, o, e) => {
      vt.ctx.addGroup('rm')
      learn(vt, 'rm', re)
      o.removeItem('rm_spell')
      o.v.push(1)
      globalFireDone()
    },
    mkdirSold: (re, o, e) => {
      vt.ctx.addGroup('mkdir')
      learn(vt, 'mkdir', re)
      o.v.push(0)
      o.removeItem('mkdir_spell')
      globalFireDone()
    }
  }
})
