({
  img: 'bridge',
  events: {
    touch: (ct) => (
      ct.arg === _('item_plank') ? 'touchPlank' : ''
    )
  },
  states: {
    touchPlank: (re, o) => {
      $clearing.unsetCmd('cd').setPerm(777)
      o.text = _('room_brokenbridge_text2')
      const it = re ? o.newItem('plank') : o.getItem('plank')
      it.img = 'item_plank.png'
    }
  }
})
