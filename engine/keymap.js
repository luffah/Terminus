var KEYMAP = {
  clear: { name: 'Ctrl-U', e: { ctrl: 1, key: 'u' } },
  break: { show: '^C', name: 'Ctrl-C', e: { ctrl: 1, key: 'c' } },
  tab: { name: 'Tab', e: { key: 'Tab' } },
  enter: { name: 'Enter', e: { key: 'Enter' } },
  forward_word: { name: 'Ctrl-U', e: { ctrl: 1, key: 'u' } },
  backward_word: { name: 'Ctrl-U', e: { ctrl: 1, key: 'u' } },
  rm_last_word: { name: 'Alt-Backspace', e: { alt: 1, key: 'Backspace' } },
  rm_last_arg: { name: 'Ctrl-X', e: { ctrl: 1, key: 'x' } },
  up: { name: 'Ctrl-P', e: { ctrl: 1, key: 'p' } },
  down: { name: 'Ctrl-N', e: { ctrl: 1, key: 'n' } },
  left: { name: 'Ctrl-B', e: { ctrl: 1, key: 'b' } },
  right: { name: 'Ctrl-F', e: { ctrl: 1, key: 'f' } },
  preserved: [ { key: 'PageUp' }, { key: 'PageDown' } ],
  disabled: [ { ctrl: 1, key: 'a' } ]
}
