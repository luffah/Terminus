var EFFECTS = {
  timeout: { badge: 3000, notification: 4000 },
  pic: { badge: new Pic({img:'badge.png'}) },
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

function loader(title, id, val, duration, next) {
  vt.show_msg(title, { cb: () => {
    vt.show_loading_element_in_msg(['/\'', '\'-', ' ,', '- '], {
      el: dom.Id(id),
      finalvalue: val,
      duration: duration,
      direct:1,
      cb: next })
  } })
}

function badge (title, text) {
  let badge = addEl(EFFECTS.notifications, 'div', 'badge')
  let now = Date.now()
  let diff = EFFECTS.last_notify - now
  let uptimeout = 0
  if (diff > 0) {
    uptimeout = diff
  }
  let disappeartimeout = uptimeout + (EFFECTS.timeout.badge / 2)
  let downtimeout = uptimeout + EFFECTS.timeout.badge
  setTimeout(function () {
    EFFECTS.notifications.removeChild(badge)
  }, downtimeout)
  setTimeout(function () {
    badge.className += ' disappear'
  }, disappeartimeout)
  setTimeout(function () {
    EFFECTS.pic.badge.render(badge)
    addEl(badge, 'span', 'badge-title').innerHTML = title
    addEl(badge, 'p', 'badge-desc').innerText = text
  }, uptimeout)
  EFFECTS.last_notify = now + downtimeout
}

function notification (text) {
  let notif = addEl(EFFECTS.notifications, 'div', 'notification')
  let now = Date.now()
  let diff = EFFECTS.last_notify - now
  let uptimeout = 0
  if (diff > 0) {
    uptimeout = diff
  }
  let disappeartimeout = uptimeout + (EFFECTS.timeout.notifation / 2)
  let downtimeout = uptimeout + EFFECTS.timeout.notification
  setTimeout(function () {
    EFFECTS.notifications.removeChild(notif)
  }, downtimeout)
  setTimeout(function () {
    notif.className += ' disappear'
  }, disappeartimeout)
  setTimeout(function () {
    addEl(notif, 'p').innerHTML = text
  }, uptimeout)
  EFFECTS.last_notify = now + downtimeout
}

/* BELOW ALL EFFECTS THAT REQUIRE VTerm */
function epic_img_enter (vt, i, clss, scrl_timeout, callback) {
  vt.scrl_lock = true
  vt.busy = true
  let c = addEl(vt.monitor, 'div', 'img-container ' + clss)
  pic = new Pic({img:i})
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
  let idx = t.msgidx
  msg = msg || t.input.value
  if (t.input_operation_interval) {
    clearInterval(t.input_operation_interval)
  }
  let inccnt = 0
  let tmpc = fromcomplexicity
  let sens = (tocomplexicity > fromcomplexicity ? 1 : -1)
  let limit = tocomplexicity * sens
  let step = (tocomplexicity - fromcomplexicity) / stepcomplexity
  t.input_operation_interval = setInterval(() => {
    if (t.msgidx != idx) {
      clearInterval(t.input_operation_interval)
      t.line=''
    } else {
      if (((tmpc * sens) < limit) && ((inccnt % incstep) == 0)) {
        tmpc = tmpc + step
      }
      t.line=shuffleStr(msg, tmpc)
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
