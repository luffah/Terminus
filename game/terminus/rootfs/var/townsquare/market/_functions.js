function buyToVendor (vt, choice) {
  if (choice === 0) {
    if ($market.hasItem('mkdir_cost')) {
      $market.removeItem('mkdir_cost')
      $market.apply('mkdirSold')
      return _('you_buy', [_('item_mkdir_spell')])
    } else {
      return _('need_money', [_('item_rm_spell')])
    }
  } else if (choice === 1) {
    if ($market.hasItem('rm_cost')) {
      $market.removeItem('rm_cost')
      $market.apply('rmSold')
      return _('you_buy', [_('item_rm_spell')])
    } else {
      return _('need_money', [_('rm_cost')])
    }
  }
}
