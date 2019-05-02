({
  img: 'troll1',
  events: { mv: 'openSlide', rm: 'openSlide' },
  states: { openSlide: (re, o) => {
    $slide.chmod(777)
    if (re) o.disappear()
  } }
})
