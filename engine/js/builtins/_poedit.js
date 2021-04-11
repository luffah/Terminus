var devMode = 0
function activateDevTools () {
  console.log('-dev mode activated-')
  devMode = 1
  Builtin.def('poe', [ARGT.msgid], function (args, env, sys) {
    var sym = args[0]
    if (sym) {
      if (dialog[sym]) {
        var cb = function (value) {
          dialog[sym] = value
        }
        vt.ask(_('po_symbol_edit'), cb, {
          multiline: true,
          value: dialog[sym],
          evkey: { Enter: (t, e) => {
            const strt = t.answer_input.selectionStart
            const bef = t.answer_input.value.substr(0, strt)
            const aft = t.answer_input.value.substr(strt)
            t.answer_input.value = bef + '\n' + aft
            t.answer_input.selectionStart = strt + 1
            t.answer_input.selectionEnd = strt + 1
          }
          },
          ctrlevkey: { Enter: (t, e) => {
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
  })

  Builtin.def('pogen', [], function (args, env, sys) {
    return { cb: function () { pogenDL() } }
  })
}
