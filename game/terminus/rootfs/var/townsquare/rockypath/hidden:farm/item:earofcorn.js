({
  img: 'corn',
  hooks: { rm: _('item_earofcorn_rm') },
  states: {
    cp: (re) => {
      farmer.setHook('less', _('corn_farmer_ok'))
      if (re) $farm.newItem('another_earofcorn')
    }
  }
})
