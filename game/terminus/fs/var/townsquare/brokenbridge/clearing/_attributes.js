({
  img: 'clearing',
  mod: 0,
  events: {
    mkdir: (ct) => {
      return (
        ct.arg === _('room_house') ? 'HouseMade' : '')
    }
  },
  hooks: { cd: _('room_clearing_cd') },
  states: {
    HouseMade: (re, o) => {
      if (re) { o.addDoor(newRoom('house')) }
      o.getChildFromName(_('room_house'))
        .setHook('cd', _('room_house_cd'))
        .setHook('ls', _('room_house_ls'))
      o.unsetHook('cd')
      o.text = _('room_clearing_text2')
      cryingman.setHook('less', _('room_clearing_less2'))
    }
  }
})
