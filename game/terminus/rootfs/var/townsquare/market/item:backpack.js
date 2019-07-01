({
  img: 'backpack',
  events: {
    mv: (ct, o) => {
      vt.echo(_('item_backpack_stolen'))
      o.unsetCmdEvent('mv')
    } },
  states: {
    less: (re, o) => {
      vt.ctx.addGroup('unzip')
      learn(vt, 'unzip', re)
      o.unsetCmdEvent('less').setPoDelta(['.zip']).setCmdEvent('unzip', (ct) => {
        let unzipped = []
        unzipped.push(ct.room.newItem('rm_cost'))
        unzipped.push(ct.room.newItem('mkdir_cost'))
        o.unsetCmdEvent('unzip').setPoDelta([])
        vt.echo(_('unzipped', [_('item_backpack'), unzipped.join(', ')]), { unbreakable: true })
      })
    }
  }
})
