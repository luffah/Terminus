({
  img: 'boulder',
  states: {
    rm: (re, o) => {
      vt.echo(_('item_largeboulder_rm'))
      $rockypath.addDoor($farm)
      if (re) o.disappear()
    }
  }
})
