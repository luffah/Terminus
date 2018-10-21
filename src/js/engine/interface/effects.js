function flash (timeout, timeoutdisappear) {
  setTimeout(function () {
    document.body.className += ' flash'
    setTimeout(function () {
      document.body.className = document.body.className.replace(/[ ]*flash/, '')
    }, timeoutdisappear)
  }, timeout)
}

function epic_img_enter (vt, i, clss, scrl_timeout, callback) {
  vt.scrl_lock = true
  vt.busy = true
  var c = addEl(vt.monitor, 'div', 'img-container ' + clss)
  pic = new Pic(i)
  pic.render(c, () => {
    c.className += ' loaded'
    setTimeout(() => {
      vt.scrl_lock = false
      vt.scrl()
      vt.busy = false
      if (callback) {
        callback(vt)
      }
    }, scrl_timeout)
  })
}
