var effects = {
  timeout: { badge: 3000, notification: 4000 },
  pic: { badge: new Pic('badge.png') },
  notifications: addEl(document.body, 'div', 'notifications'),
  last_notify: Date.now()
}

function flash (timeout, timeoutdisappear) {
  setTimeout(function () {
    document.body.className += ' flash'
    setTimeout(function () {
      document.body.className = document.body.className.replace(/[ ]*flash/, '')
    }, timeoutdisappear || 800)
  }, timeout || 0)
}

function badge (title, text) {
  var badge = addEl(effects.notifications, 'div', 'badge')
  var now = Date.now()
  var diff = effects.last_notify - now
  var uptimeout = 0
  if (diff > 0) {
    uptimeout = diff
  }
  var disappeartimeout = uptimeout + (effects.timeout.badge / 2)
  var downtimeout = uptimeout + effects.timeout.badge
  setTimeout(function () {
    effects.notifications.removeChild(badge)
  }, downtimeout)
  setTimeout(function () {
    badge.className += ' disappear'
  }, disappeartimeout)
  setTimeout(function () {
    effects.pic.badge.render(badge)
    addEl(badge, 'span', 'badge-title').innerHTML = title
    addEl(badge, 'p', 'badge-desc').innerText = text
  }, uptimeout)
  effects.last_notify = now + downtimeout
}

function notification (text) {
  var notif = addEl(effects.notifications, 'div', 'notification')
  var now = Date.now()
  var diff = effects.last_notify - now
  var uptimeout = 0
  if (diff > 0) {
    uptimeout = diff
  }
  var disappeartimeout = uptimeout + (effects.timeout.notifation / 2)
  var downtimeout = uptimeout + effects.timeout.notification
  setTimeout(function () {
    effects.notifications.removeChild(notif)
  }, downtimeout)
  setTimeout(function () {
    notif.className += ' disappear'
  }, disappeartimeout)
  setTimeout(function () {
    addEl(notif, 'p').innerHTML = text
  }, uptimeout)
  effects.last_notify = now + downtimeout
}

/* BELOW ALL EFFECTS THAT REQUIRE VTerm */
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

function auto_shuffle_line (t, msg, fromcomplexicity, tocomplexicity, stepcomplexity, period, duration, incstep) {
  var idx = t.msgidx
  msg = msg || t.input.value
  if (t.input_operation_interval) {
    clearInterval(t.input_operation_interval)
  }
  var inccnt = 0
  var tmpc = fromcomplexicity
  var sens = (tocomplexicity > fromcomplexicity ? 1 : -1)
  var limit = tocomplexicity * sens
  var step = (tocomplexicity - fromcomplexicity) / stepcomplexity
  t.input_operation_interval = setInterval(function () {
    if (t.msgidx != idx) {
      clearInterval(t.input_operation_interval)
      t.set_line('')
    } else {
      if (((tmpc * sens) < limit) && ((inccnt % incstep) == 0)) {
        tmpc = tmpc + step
      }
      t.set_line(shuffleStr(msg, tmpc))
      inccnt++
    }
  }, period)
  if (duration) {
    setTimeout(function () {
      if (idx == t.msgidx) {
        t.msgidx++
      }
    }, duration)
  }
}
