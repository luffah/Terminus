({
  img: 'merchant',
  events: {
    less_done: (ct, o) => {
      vt.askChoose(_('people_vendor_text'), [_('people_vendor_sell_mkdir'),
        _('people_vendor_sell_rm'), _('people_vendor_sell_nothing')],
      buyToVendor, { disabled_choices: o.room.v })
    },
    hooks: { rm: _('people_vendor_rm') }
  }
})
