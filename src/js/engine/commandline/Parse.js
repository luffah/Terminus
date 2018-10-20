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

function _completeArgs (args, argidx, tocomplete, ctx, compl) { // return completion matches
  let roomCurrent = tocomplete.substring(0, 1) == '~' ? $home : ctx.room
  tocomplete = tocomplete.replace(/\*/g, '.*')
  // Iterate through each room
  let roomNext

  var substrMatches = []

  let argtype = argidx ? ctx.getCommand(args[0]).syntax[argidx-1][0] : 'cmdname'

  if (argtype == 'cmdname') {
    var cmds = ctx.getUserCommands()
    //    tocomplete=args.shift();
    cmds.forEach((i) => {
      if (compl(cmds[i])) {
        substrMatches.push(cmds[i] + ((cmds[i] == tocomplete) ? ' ' : ''))// if uniq, then go to next arg
      }
    })
    return substrMatches
  } else if (argtype == 'msgid') {
    return Object.keys(dialog).filter(function (i) {
      return i.match('^' + tocomplete)
    }).slice(0, 20)
  } else {
    var path = tocomplete.split('/')
    if (argtype == 'dir' && path.length == 1 && path[0].length === 0) {
      substrMatches.push('..')
    }
    for (let i = 0; i < path.length; i++) {
      roomNext = roomCurrent.can_cd(path[i], ctx)
      if (roomNext) {
        roomCurrent = roomNext
        if (i === path.length - 1) {
          ret.push(roomNext.name + '/')
        }
      } else {
        // We've made it to the final room,
        // so we should look for things to complete our journey
        if (i == path.length - 1) {
          // Compare to this room's children
          if (['strictfile', 'file', 'dir'].indexOf(argtype) != -1) {
            for (child_num = 0; child_num < roomCurrent.children.length; child_num++) {
              if (compl(roomCurrent.children[child_num].name, path[i])) {
                substrMatches.push(roomCurrent.children[child_num].name + '/')
              }
            }
            // Compare to this room's items
            if (['strictfile', 'file'].indexOf(argtype) != -1) {
              for (itemIdx = 0; itemIdx < roomCurrent.items.length; itemIdx++) {
                if (compl(roomCurrent.items[itemIdx].name, path[i])) {
                  substrMatches.push(roomCurrent.items[itemIdx].name)
                }
              }
            }
          }
        }
      }
    }
  }
  return substrMatches
}

function _parse_exec (vt, line) {
  var commands = line.split(';')
  let ret = new Seq()
  for (let i = 0; i < commands.length; i++) {
    ret.append(_parse_command(vt, commands[i]))
  }
  return ret
}

function _parse_command (vt, line) {
  var arrs = line.split(' ').filter((s) => s.length)
  var ctx = vt.getContext()
  var cmd = arrs[0]; var r = ctx.room; var ret = ''
  arrs.push(arrs.pop().replace(/\/$/, ''))
  console.log('parse and execute : ', arrs, r)
  var args = _expandArgs(arrs.slice(1), r)
  // find the program to launch
  var cmdexec = null
  if (cmd.match(/^(\.\/|\/)/)) { // find a local program
    console.log('matched')
    var tr = r.traversee(cmd)
    if (tr.item && tr.item.ismod('x', ctx)) {
      cmdexec = function (args, ctx, vt) {
        return tr.item.exec(args, ctx, vt)
      }
    }
  }
  if (!cmdexec && ctx.hasRightForCommand(cmd)) { // find a builtin program
    cmdexec = global_commands_fu[cmd].fu
  }
  // test command eligibility when no existant cmd
  if (!cmdexec) {
    if (cmd in r.cmd_hook) {
      r.fire_event(vt, cmd + '_cmd_hook', args, 0)
      re = r.cmd_hook[cmd](args)
      if ('ret' in re) {
        ret = re.ret
      }
    } else {
      r.fire_event(vt, 'cmd_not_found', args, 0)
      r.fire_event(vt, cmd + '_cmd_not_found', args, 0)
      ret = cmd_done(vt, [[r, 0]], psychologist(ctx, cmd, args), 'cmd_not_found', args)
    }
    return ret
  }

  // asume there is a collection of password to unlock
  // if the collection is empty then the command is executed
  var passwordcallback = (passok, cmdpass) => {
    var ret = ''
    if (passok) {
      var text_to_display = cmdexec(args, ctx, vt)
      if (text_to_display) {
        ret = text_to_display
      } else if (cmd in r.cmd_hook) {
        ret = r.cmd_hook[cmd](args)
      }
    } else {
      ret = _('room_wrong_password')
    }
    return ret
  }

  // construct the list of passwords to give
  var cmdpass = []
  if (cmd in r.commands_lock) {
    if (cmd.locked_inside) {
      cmdpass.push(r.commands_lock[cmd])
    }
  }

  var tgt, cur
  for (let i = 0; i < args.length; i++) {
    tgt = r.traversee(args[i])
    cur = tgt.room
    // don't ask passwd for items OR if no room
    if (!cur || tgt.item) { continue }
    if (i === 0 && !ctx.hasRightForCommand(cmd)) {
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
