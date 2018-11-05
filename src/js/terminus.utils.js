File.prototype.and=() => this.room
var into=(id, img, prop) => window.hasOwnProperty('$'+id) ? window['$'+id] : newRoom(id,img,prop)
Room.prototype.or=Room.prototype.initConcat
Room.prototype.then=Room.prototype.concatNew
Room.prototype.findLink=Room.prototype.concatLink
Room.prototype.where_u_meet=Room.prototype.addPeopleOnQueue
Room.prototype.where_u_find=Room.prototype.addItemOnQueue
Room.prototype.where_u_findMany=Room.prototype.addItemBatchOnQueue
Room.prototype.go=Room.prototype.addDoor
Room.prototype.at=Room.prototype.newRoom
Room.prototype.find=Room.prototype.newItem
Room.prototype.meet=Room.prototype.newPeople

function getTime () {
  var d, h, m; d = new Date(); h = d.getHours(); m = d.getMinutes()
  return h + 'h' + (m < 10 ? '0' : '') + m
}

function learn (cmds, re) {
  if (typeof cmds === 'string') {
    cmds = [cmds]
  }
  if (!re) {
    global_fireables.done.push(
      function () {
        for (var j = 0; j < cmds.length; j++) {
          badge(cmds[j], _('you_learn', [cmds[j]]))
          vt.playSound('learned')
        }
      }
    )
  }
}

function unlock (vt, unlocked, re) {
  if (!re) {
    global_fireables.done.push(
      function () {
        vt.playSound('unlocked')
        badge(_('you_unlock', [unlocked]))
      }
    )
  }
}

function mesg (msg, re, opt) {
  if (!re) {
    opt = opt || {}
    var fu = function () {
      setTimeout(function () {
        vt.show_msg('<div class="mesg">' +
            _('msg_from', [opt.user || '????', opt.tty || '???', getTime()]) +
            '\n' +
            msg + '</div>',
        { direct: true }
        )
      }, opt.timeout || 0)
    }
    if (opt.ondone) {
      global_fireables.done.push(fu)
    } else {
      fu()
    }
  }
}
function addGroup(grp){
  vt.context.addGroup(grp)
}

function hasGroup(grp){
  return vt.context.hasGroup(grp)
}

function playMusic(key, p) {
  vt.playMusic(key, p)
}

function playSound(key) {
  vt.playSound(key)
}

function ondone (fu) {
  global_fireables.done.push(fu)
}

function success (txt, re) {
  if (!re) {
    global_fireables.done.push(
      function () {
        vt.playSound('success')
        badge(_('you_success', [txt]))
        mesg(_('congrat', [txt]))
      }
    )
  }
}
