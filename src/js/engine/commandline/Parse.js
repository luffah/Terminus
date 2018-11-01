var regexpStr = /^['"].*['"]$/
var regexpStar = /.*\*.*/
function _expandArgs (args, ctx) {
  var newargs = []
  args.forEach((arg) => {
    if (regexpStr.test(arg)) {
      newargs.push(arg.slice(1, arg.length - 1))
    } else if (regexpStar.test(arg)) {
      let [room, lastcomponent, path] = ctx.room.pathToRoom(arg)
      if (room && lastcomponent) {
        let regexpArg = new RegExp(lastcomponent.replace(/\./g, '\\\.').replace(/\*/g, '.*'))
        let xargs = []
        room.items.map(objToStr).filter((a) => regexpArg.test(a)).forEach((it) => {
          console.log(it)
          xargs.push(path + (path.length ? '/' : '') + it)
        })
        newargs = newargs.concat(xargs.sort())
      } else {
        newargs.push(arg)
      }
    } else {
      newargs.push(arg)
    }
  })
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

  let argtype = argidx ? ctx.getCommand(args[0]).getSyntax(args.slice(1), argidx - 1) : 'cmdname'

  if (argtype == 'cmdname') {
    var cmds = ctx.getCommands()
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
    let path = tocomplete.split('/')
    if (argtype == 'dir' && path.length == 1 && path[0].length === 0) {
      substrMatches.push('..')
    }
    for (let i = 0; i < path.length; i++) {
      roomNext = roomCurrent.getDir(path[i])
      if (roomNext) {
        roomCurrent = roomNext
        if (i === path.length - 1) {
          ret.push(roomNext.name + '/')
        }
      } else if (i === path.length - 1) {
        // We've made it to the final room,
        // so we should look for things to complete our journey
        // Compare to this room's children
        if (['strictfile', 'file', 'dir'].indexOf(argtype) != -1) {
          roomCurrent.children.forEach((c) => {
            if (compl(c.name, path[i])) {
              substrMatches.push(c.name + '/')
            }
          })
          // Compare to this room's items
          if (argtype != 'dir') {
            roomCurrent.items.forEach((it) => {
              if (compl(it.name, path[i])) { substrMatches.push(it.name) }
            })
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
    let res = _parse_command(vt, commands[i])
    ret.append(res)
  }
  return ret
}

function _parse_command (vt, line) {
  var arrs = line.split(' ').filter((s) => s.length)
  var ctx = vt.getContext()
  var cmdname = arrs[0]; var r = ctx.room; var ret = ''
  arrs.push(arrs.pop().replace(/\/$/, ''))
  console.log('parse and execute : ', arrs, ctx)
  var args = _expandArgs(arrs.slice(1), ctx)
  // find the program to launch
  let cmd = ctx.getCommand(cmdname)

  // test command hook eligibility when no existant cmd
  if (!cmd) {
    if (cmdname in r.cmd_hook) {
      r.fire_event(vt, cmdname + '_cmd_hook', args, 0)
      re = r.cmd_hook[cmd](args)
      if ('ret' in re) {
        ret = re.ret
      }
    } else {
      r.fire_event(vt, 'cmd_not_found', args, 0)
      r.fire_event(vt, cmdname + '_cmd_not_found', args, 0)
      ret = cmd_done(vt, [[r, 0]], psychologist(ctx, cmdname, args), 'cmd_not_found', args)
    }
    return ret
  }

  var ret = ''
  var text_to_display = cmd.exec(args, ctx, vt)
  if (text_to_display) {
    ret = text_to_display
  } else if (cmdname in r.cmd_hook) {
    ret = r.cmd_hook[cmd](args)
  }
  return ret
}
