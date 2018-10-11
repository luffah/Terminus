_defCommand('poe', [ARGT.msgid], function (args, ctx, vt) {
  var sym = args[0]
  if (sym) {
    if (dialog[sym]) {
      var cb = function (value) {
        dialog[sym] = value
      }
      vt.ask(_('po_symbol_edit'), cb, { multiline: true, value: dialog[sym] })
      return ''
    } else {
      return _stderr(_('po_symbol_unknown'))
    }
  }
  return _stderr(_('incorrect_syntax'))
})

_defCommand('pogen', 'poe', [], function (args, ctx, vt) {
  var ret = pogen_deliver_link()
  return [ret, function () {
    ret.click()
  }]
})
