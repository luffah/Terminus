function flash(timeout, timeoutdisappear) {
  setTimeout(function () {
    document.body.className += ' flash'
      setTimeout(function () {
        document.body.className = document.body.className.replace(/[ ]*flash/, '')
      }, timeoutdisappear)
  }, timeout)
}
