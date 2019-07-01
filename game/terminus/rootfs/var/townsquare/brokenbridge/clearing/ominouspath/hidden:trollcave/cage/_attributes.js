({
  img: 'cage',
  cls: 'covering',
  mod: 666,
  pic_shown_as_item: true,
  hooks: {
    cd: (args) => ({ ret: _stdout(_('room_cage_cd')) })
  }
})
