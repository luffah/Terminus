({
  img: 'poney',
  bgcolor: '#22b14c',
  v: 0,
  states: {
    less: (re, o, e) => {
      o.room.addDoor($mountain)
      mesg(_('new_path', [$mountain]), re, { timeout: 600, ondone: true })
      unlock(vt, $mountain, re)
      o.unsetCmdEvent(e)
    },
    less_done: (re, o, e) => {
      o.textIdx = ++o.v
      if (o.v === 10) o.setCmdEvent('less_done', 'uptxthint')
    },
    uptxthint: (re, o, e) => {
      if (!vt.statkey.Tab || vt.statkey.Tab === 0) {
        o.textIdx = 'tab'
      } else if (!vt.ctx.hasGroup('mv')) {
        o.textIdx = 'mv'
      } else if (!state.applied('mvBoulder')) {
        o.textIdx = 'mountain'
      } else {
        o.textIdx = 'help'
      }
    }
  }
})
