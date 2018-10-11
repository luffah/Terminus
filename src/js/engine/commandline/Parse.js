var regexpStr = /^['"].*['"]$/
var regexpStar = /.*\*.*/
function _expandArgs (args, ctx) {
  var newargs = []; var room; var lastcomponent; var path; var re; var r = ctx.room
  //  console.log('_expandArgs',args,r);
  for (var i = 0; i < args.length; i++) {
    //    console.log(args[i]);
    if (regexpStr.test(args[i])) {
      newargs.push(args[i].slice(1, args[i].length - 1))
    } else if (regexpStar.test(args[i])) {
      roomp = r.pathToRoom(args[i])

      room = roomp[0]
      lastcomponent = roomp[1]
      re = new RegExp(lastcomponent.replace(/\./g, '\\\.').replace(/\*/g, '.*'))
      if (room && lastcomponent) {
        //        console.log(lastcomponent);
        path = roomp[2]
        var expanded = []
        for (var j = 0; j < room.items.length; j++) {
          if (re.test(room.items[j].toString())) {
            expanded.push(path + (path.length ? '/' : '') + room.items[j].toString())
          }
        }
        newargs = newargs.concat(expanded.sort())
      } else {
        newargs.push(args[i])
      }
    } else {
      newargs.push(args[i])
    }
  }
  return newargs
}

function _validArgs (cmd, args, ctx) {
  if (cmd == 'ls') {
    return true
  } else {
    if (args.length == 1) {
      if (['man', 'cd', 'mkdir', 'less', 'touch', 'unzip'].indexOf(cmd) > -1) {
        return true
      }
    }
    return false
  }
}

function commonprefix (array) {
  // https://stackoverflow.com/questions/1916218/find-the-longest-common-starting-substring-in-a-set-of-strings/1917041#1917041
  var A = array.concat().sort()

  var a1 = A[0]; var a2 = A[A.length - 1]; var L = a1.length; var i = 0
  while (i < L && a1.charAt(i) === a2.charAt(i)) i++
  return a1.substring(0, i)
}

function _completeArgs (args, argidx, tocomplete, ctx, compl) { // return completion matches
  var roomCurrent = tocomplete.substring(0, 1) == '~' ? $home : ctx.room
  tocomplete = tocomplete.replace(/\*/g, '.*')
  // Iterate through each room
  var roomNext

  var substrMatches = []

  var cmd = args[0]
  var syntax = [ARGT.cmdname].concat(_getCommandSyntax(cmd))

  if (_argType(syntax, argidx, ARGT.cmdname)) {
    var cmds = _getUserCommands()
    //    tocomplete=args.shift();
    idx = 0
    for (var i = 0; i < cmds.length; i++) {
      if (compl(cmds[i])) {
        substrMatches.push(cmds[i] + ((cmds[i] == tocomplete) ? ' ' : ''))// space is here to say : if only one found, then go to next arg
      }
    }
    return substrMatches
  }
  if (_argType(syntax, argidx, ARGT.msgid)) {
    //    if (cmd=='poe') {
    return Object.keys(dialog).filter(function (i) {
      return i.match('^' + tocomplete)
    }).slice(0, 20)
  }
  var path = tocomplete.split('/')
  if (_argType(syntax, argidx, ARGT.dir) && path.length == 1 && path[0].length === 0) {
    substrMatches.push('..')
  }
  for (var roomIdx = 0; roomIdx < path.length; roomIdx++) {
    roomNext = roomCurrent.can_cd(path[roomIdx])
    if (roomNext) {
      roomCurrent = roomNext
      if (roomIdx === path.length - 1) {
        ret = [roomNext.name + '/' ]
      }
    } else {
      // We've made it to the final room,
      // so we should look for things to complete our journey
      if (roomIdx == path.length - 1) {
        // Compare to this room's children
        if (_argType(syntax, argidx, ARGT.strictfile) || _argType(syntax, argidx, ARGT.file) || _argType(syntax, argidx, ARGT.dir)) {
          for (child_num = 0; child_num < roomCurrent.children.length; child_num++) {
            if (compl(roomCurrent.children[child_num].name, path[roomIdx])) {
              substrMatches.push(roomCurrent.children[child_num].name + '/')
            }
          }
          // Compare to this room's items
          if (_argType(syntax, argidx, ARGT.strictfile) || _argType(syntax, argidx, ARGT.file)) {
            for (itemIdx = 0; itemIdx < roomCurrent.items.length; itemIdx++) {
              if (compl(roomCurrent.items[itemIdx].name, path[roomIdx])) {
                substrMatches.push(roomCurrent.items[itemIdx].name)
              }
            }
          }
        }
      }
    }
  }
  return substrMatches
}
// TODO: how to save filesystem structure
function _parse_exec (vt, arrs, superuser) {
  var ctx = vt.getContext()
  var cmd = arrs[0]; var r = ctx.room; var ret = ''
  arrs.push(arrs.pop().replace(/\/$/, ''))
   console.log('_parse_exec',arrs,r);
  var args = _expandArgs(arrs.slice(1), r)
  // find the program to launch
  var cmdexec = null
  if (cmd.match(/^(\.\/|\/)/)) { // find a local program
         console.log('matched');
    var tr = r.traversee(cmd)
    var item = tr.item; var r = tr.room
    if (item && item.executable) {
      cmdexec = function (args, ctx, vt) {
        return item.exec(args, ctx, vt)
      }
    }
  }
  if (!cmdexec && _hasRightForCommand(cmd, ctx)) { // find a builtin program
    cmdexec = _getCommandFunction(cmd)
  }
  // test command eligibility when no existant cmd
  if (!cmdexec) {
    if (cmd in r.cmd_text) {
      r.fire_event(vt, cmd + '_cmd_text', args, 0)
      ret = r.cmd_text[cmd]
    } else {
      r.fire_event(vt, 'cmd_not_found', args, 0)
      r.fire_event(vt, cmd + '_cmd_not_found', args, 0)
      ret = cmd_done(vt, [[r, 0]], psychologist(ctx, cmd, args), 'cmd_not_found', args)
    }
    return ret
  }
  // asume there is a collection of password to unlock
  // if the collection is empty then the command is executed
  var passwordcallback = function (passok, cmdpass) {
    var ret = ''
    if (passok) {
      var text_to_display = cmdexec(args, ctx, vt)
      if (text_to_display) {
        ret = text_to_display
      } else if (cmd in r.cmd_text) {
        ret = r.cmd_text[cmd]
      }
    } else {
      ret = _('room_wrong_password')
    }
    return ret
  }

  // construct the list of passwords to give
  var cmdpass = []
  if (cmd in r.commands_lock) {
    if (cmd.locked_inside) { // test option locked inside
      cmdpass.push(r.commands_lock[cmd])
    }
  }
  var tgt, cur
  for (var i = 0; i < args.length; i++) {
    tgt = r.traversee(args[i])
    cur = tgt.room
    // don't ask passwd for items OR if no room
    if (!cur || tgt.item) { continue }
    if (i === 0 && !_hasRightForCommand(cmd, vt.context)) {
      if (cmd in cur.cmd_text) {
        ret = cur.cmd_text[cmd]
      } else {
        ret = _('cmd_not_found', [cmd, cur.name])
      }
      return ret
    }
    if (cmd in cur.commands_lock) {
      if (cmd === 'sudo' && cur.hasOwnProperty('supass') && cur.supass) {
        continue
      }
      cmdpass.push(cur.commands_lock[cmd])
    }
  }
  // ask passwords and exec
  if (cmdpass.length > 0) {
    vt.ask_password(cmdpass, passwordcallback)
  } else {
    return passwordcallback(true)
  }
}
