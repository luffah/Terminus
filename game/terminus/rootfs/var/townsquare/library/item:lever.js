({
  img: 'lever',
  mod: 777,
  states: {
    exec: function (re, o) {
      $library.addDoor($backroom)
      if (!re) vt.echo(_('item_lever_exec'))
      o.disappear()
    }
  }
})
