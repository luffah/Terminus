function getTime () {
  var d, h, m; d = new Date(); h = d.getHours(); m = d.getMinutes()
  return h + 'h' + (m < 10 ? '0' : '') + m
}

function learn (cmds, re) {
  if (cmds instanceof String){
    cmds = [cmds]
  }
  if (!re) {
    vt.onNext('CmdLineDone',
      function (ret) {
      for (var j = 0; j < cmds.length; j++) {
        badge(cmds[j], _('you_learn', [cmds[j]]))
        vt.playSound('learned')
      }
    })
  }
}

function unlock (vt, unlocked, re) {
  if (!re) {
    globalFireables.done.push(
      function () {
        vt.playSound('unlocked')
        // mesg(_('congrat', [unlocked]))
      }
    )
  }
}

function mesg (msg, re, opt) {
  if (!re) {
    opt = opt || {}
    var fu = function () {
      setTimeout(function () {
        vt.echo('<div class="mesg">' +
            _('msg_from', [opt.user || '????', opt.tty || '???', getTime()]) +
            '\n' +
            msg + '</div>',
        { direct: true }
        )
      }, opt.timeout || 0)
    }
    if (opt.ondone) {
      globalFireables.done.push(fu)
    } else {
      fu()
    }
  }
}
function addGroup (grp) {
  vt.env.addGroup(grp)
}

// function hasGroup (grp) {
//   return vt.env.hasGroup(grp)
// }

function playMusic (key, p) {
  vt.playMusic(key, p)
}

function playSound (key) {
  vt.playSound(key)
}

function ondone (fu) {
  globalFireables.done.push(fu)
}

function success (txt, re) {
  if (!re) {
    globalFireables.done.push(
      function () {
        vt.playSound('success')
        badge(_('you_success', [txt]))
      }
    )
  }
}
