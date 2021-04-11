const WM = {
  set activeWindow (w) {
    this._activeWindow = w
    this.behave()
  },
  get activeWindow () { return this._activeWindow },
  behave () {
    const v = this
    dom.body.onkeydown = function (e) {
      e = e || window.event// Get event
      return v._activeWindow.onkeydown(e)
    }
    dom.body.onkeyup = function (e) {
      e = e || window.event// Get event
      return v._activeWindow.onkeyup(e)
    }
  }
}

function overide (e) {
  e.preventDefault()
  e.stopPropagation()
}

function overideINPUT (e) {
  if (e.code.match(/Tab|Enter|ArrowUp|ArrowDown/)) {
    overide(e)
  } else if (e.ctrlKey) {
    if ((e.key || String.fromCharCode(e.keyCode)).match(/^[ACVXYZ]$/)) {
      overide(e)
    }
  }
}

function overideDEFAULT (e) {
}

class Window {
  constructor () {
    WM.activeWindow = this
  }

  focus (el) {
    this.focused = el
    if (el.tagName === 'INPUT') {
      this.overide = overideINPUT
    } else {
      this.overide = overideDEFAULT
    }
  }

  onkeydown (e) {
    const focused = dom.activeElement
    if (!focused || focused !== this.focused) {
      this.focusInput()
    }
    this.overide(e)
    this.focused.keydown(e)
    return !e.defaultPrevented
  }

  onkeyup (e) {
    const focused = dom.activeElement
    if (!focused || focused !== this.focused) {
      this.focusInput()
    }
    this.overide(e)
    this.focused.keyup(e)
    return !e.defaultPrevented
  }
}
