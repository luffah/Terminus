({
  img: 'brambles',
  cls: 'large',
  hooks: {
    mv: _('item_brambles_mv'),
    rm: _('item_brambles_rm')
  },
  states: {
    rm: (re, o) => {
      $ominouspath.addDoor($trollcave)
      if (re) o.disappear()
    }
  }
})
