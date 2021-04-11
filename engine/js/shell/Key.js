class Key {
  constructor (e) {
    const k = this
    k.ctrl = e.ctrlKey
    k.shift = e.shiftKey
    k.alt = e.altKey
    k.key = e.key || String.fromCharCode(e.keyCode)
    k.str = (k.key.length === 1 ? k.key : '')
  }

  is (k, or) {
    const ka = this
    return or && ka.is({ key: or }) || (!(
      (ka.shift !== Boolean(k.shift)) ||
      (ka.ctrl !== Boolean(k.ctrl)) ||
      (ka.alt !== Boolean(k.alt)) ||
      (ka.key !== k.key)
    ))
  }

  static toStr (k) {
    return (k.ctrl ? 'Ctrl+' : '') + (k.alt ? 'Alt+' : '') + (k.shift ? 'Shift+' : '') + k.key
  }
}
