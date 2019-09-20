({
  img: 'artisanshop',
  events: {
    touch: (ct) => { if (ct.arg === _('item_gear')) { return 'touchGear' } },
    cp: (ct) => {
      const re = new RegExp(_('item_gear') + '\\d')
      if (re.test(ct.arg)) {
        for (let j = 1; j < 6; j++) {
          if (!ct.room.getItemFromName(_('item_gear', [j]))) {
            return ''
          }
        }
        return 'FiveGearsCopied'
      }
    }
  },
  states: {
    touchGear: (re) => {
      artisan.setHook('less', _('item_gear_touch'))
      vt.ctx.addGroup('cp')
      learn(vt, 'cp', re)
      const it = re ? $artisanshop.newItem('gear') : $artisanshop.getItem('gear')
      it.img = 'item_gear.png'
      state.saveCookie()
    },
    FiveGearsCopied: (re) => {
      artisan.setHook('less', _('item_gear_artisans_ok'))
      $artisanshop.removeItem('gear')
      if (!re) {
        for (let i = 1; i < 6; i++) $artisanshop.removeItem('gear', [i])
      }
      state.saveCookie()
    }
  }
})
