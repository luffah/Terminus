Builtin.def('poe', [ARGT.msgid], function (args, ctx, vt) {
  var sym = args[0]
  if (sym) {
    if (dialog[sym]) {
      var cb = function (value) {
        dialog[sym] = value
      }
      vt.ask(_('po_symbol_edit'), cb, {
        multiline: true,
        value: dialog[sym],
        evkey: { 'Enter': (t, e) => {
          let strt = t.answer_input.selectionStart
          let bef = t.answer_input.value.substr(0, strt)
          let aft = t.answer_input.value.substr(strt)
          t.answer_input.value = bef + '\n' + aft
          t.answer_input.selectionStart = strt + 1
          t.answer_input.selectionEnd = strt + 1
        }
        },
        ctrlevkey: { 'Enter': (t, e) => {
          t.enterKey()
          e.preventDefault()
          t.scrl()
        }
        }
      })
      return ''
    } else {
      return _stderr(_('po_symbol_unknown'))
    }
  }
  return _stderr(_('incorrect_syntax'))
}).hidden=1

Builtin.def('pogen', [], function (args, ctx, vt) {
  return { cb: function () { pogen_dl() } }
}).hidden=1
