({
  img: 'boulder',
  cls: 'large',
  states: {
    mv: (re, o) => {
      if (!$dank.hasChild($tunnel)) {
        $dank.addDoor($tunnel)
        if (re) {
          o.moveTo($small_hole)
        }
      }
    }
  }
})
