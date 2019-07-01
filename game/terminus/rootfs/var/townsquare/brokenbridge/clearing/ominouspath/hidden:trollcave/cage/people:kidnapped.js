({
  img: 'kidnapped',
  states: {
    mv: (re, o) => {
      vt.echo(_('people_kidnapped_mv'))
      o.moveTo($clearing)
    }
  }
})
