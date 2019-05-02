class Context {
  constructor (h) {
    // h = {users:{$name: {groups:[]}}, me:$name, r:$room,  v:{PATH:[],HOME:$room} }
    h = h || {}
    h.users = h.users || {}
    if (!h.users[h.me]) {
      h.users[h.me] = { groups: [] }
    }
    if (!h.r && h.v) h.r = h.v.HOME
    this.h = h
    this.similar_score_min = 0.5
    this.km = h.keymap || KEYMAP
  }
  get r () { return this.h.r }
  set r (r) { this.h.r = r }
  get vars () { return this.h.v }
  set me (u) {
    if (u.length) {
      this.h.users[u] = this.h.users[this.h.me]
      delete this.h.users[this.h.me]
      this.h.me = u
      File.prototype.user = u
    }
  }
  get PS1 () { return '$&nbsp;' }
  get me () { return this.h.me }
  get user () { return this.h.users[this.h.me] }
  traversee (path) {
    return this.h.r.traversee(path, this)
  }
  getDir (p) {
    return this.h.r.getDir(p, this)
  }
  addGroup (grp) {
    addUniq(this.user.groups, grp)
  }
  hasGroup (grp) {
    return this.user.groups.indexOf(grp) > -1
  }
  getCommand (cmdname) {
    let c = this
    if (cmdname.match(re.localcmd)) { // find a local program
      let tr = c.traversee(cmdname)
      if (tr.item && tr.item.ismod('x', c)) {
        return tr.item
      }
    }
    let cmd = Builtin.get(cmdname)
    if (cmd) return cmd
    if (this.h.v.PATH) {
      let p = this.h.v.PATH
      let it
      for (let i = 0; i < p.length; i++) {
        it = p[i].getItemFromName(cmdname)
        if (it && it.ismod('x', this)) return it
      }
    }
  }
  hasRightForCommand (cmdname) {
    return this.getCommand(cmdname)
  }
  getCommands () {
    let ret = []
    let i
    let r = this.h.r
    for (i = 0; i < r.items.length; i++) {
      if (r.items[i].ismod('x', this)) {
        ret.push('./' + r.items[i].name)
      }
    }
    ret = ret.concat(Builtin.keys())
    if (this.h.v.PATH) {
      let p = this.h.v.PATH
      for (i = 0; i < p.length; i++) {
        ret = ret.concat(p[i].items.filter(it => it.ismod('x', this)).map(it => it.name))
      }
    }
    return ret
  }
  expandArgs (args) {
    var newargs = []
    args.forEach((arg) => {
      let c = this
      if (re.str.test(arg)) { //  simple 'quote'
        return newargs.push(arg.slice(1, arg.length - 1))
      }
      // from escaped chars are accounted
      let escaped = (arg.match(re.escaped) || []).map((a) => a.replace(/^\\/, ''))
      let escword = (
        '#' + '‡†‰©š®²³µ¶¸¾½¼¿<ESCAPED;>'.repeat(5).split('').sort(randomSort).join('') + '#'
      ) // ugly way to escape chars -> we store escaped chars; replace by ESCWORD; and reset at end
      let unesc = (s) => {
        let escidx = 0
        return s.replace(
          new RegExp(escword, 'g'),
          () => { return escaped[escidx++] }
        )
      }
      // console.log(arg)
      arg = arg.replace(re.escaped, escword)
      //
      // console.log(arg)
      arg = arg.replace(re.varr, (a) => c.vars[a.replace(/^\$/, '')] || '')
      if (re.strv.test(arg)) { //  double "quote"
        // console.log(arg)
        return newargs.push(unesc(arg.slice(1, arg.length - 1)))
      }
      arg = arg.replace(re.strr, (a) => a.slice(1, a.length - 1))

      if (re.star.test(arg)) {
        let [room, lastcomponent, path] = c.r.pathToRoom(arg)
        if (room && lastcomponent) {
          let regexpArg = new RegExp(lastcomponent.replace(/\./g, '.').replace(/\*/g, '.*'))
          let xargs = []
          room.items.map(objToStr).filter((a) => regexpArg.test(a)).forEach((it) => {
            // console.log(it)
            xargs.push(unesc(path + (path.length ? '/' : '') + it))
          })
          newargs = newargs.concat(xargs.sort())
        } else {
          newargs.push(unesc(arg))
        }
      } else {
        newargs.push(unesc(arg))
      }
    })
    return newargs
  }
  completeArgs (args, idx, tocomplete, compl) { // return completion matches
    let c = this
    let roomCurrent = tocomplete.substring(0, 1) === '~' ? c.vars.HOME : c.r
    tocomplete = tocomplete.replace(/\*/g, '.*')
    // Iterate through each room
    let roomNext

    var substrMatches = []
    // console.log(args)
    let argtype = idx ? c.getCommand(args[0]).getSyntax(idx - 1) : 'cmdname'

    if (argtype === 'cmdname') {
      var cmds = c.getCommands()
      cmds.forEach((i) => {
        if (compl(cmds[i])) {
          substrMatches.push(cmds[i] + ((cmds[i] === tocomplete) ? ' ' : ''))// if uniq, then go to next arg
        }
      })
      return substrMatches
    } else if (argtype === 'msgid') {
      return Object.keys(dialog).filter(function (i) {
        return i.match('^' + tocomplete)
      }).slice(0, 20)
    } else {
      let path = tocomplete.split('/')
      if (argtype === 'dir' && path.length === 1 && path[0].length === 0) {
        substrMatches.push('..')
      }
      for (let i = 0; i < path.length; i++) {
        roomNext = roomCurrent.getDir(path[i], c)
        if (roomNext) {
          roomCurrent = roomNext
          if (i === path.length - 1) {
            substrMatches.push(roomNext.name + '/')
          }
        } else if (i === path.length - 1) {
          // We've made it to the final room,
          // so we should look for things to complete our journey
          // Compare to this room's children
          if (['strictfile', 'file', 'dir'].indexOf(argtype) !== -1) {
            roomCurrent.children.forEach((c) => {
              if (compl(c.name, path[i])) {
                substrMatches.push(c.name + '/')
              }
            })
            // Compare to this room's items
            if (argtype !== 'dir') {
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
  _strip_comment (line) { // FIXME: js regexp confuse \' with ' and \\' -> char by char ?
    let comment = (line.match(/((('[^']*')|("[^"]*")))|#.*/g) || []).pop()
    return (comment && comment.startsWith('#')) ? line.replace(comment, '') : line
  }
  _is_empty (line) {
    line = line.replace(/\s*/, '')
    if (line.length === 0 || line.startsWith('#')) return true
  }
  _split_commands (line) { // FIXME: js regexp confuse \' with ' and \\' -> char by char ?
    return this._is_empty(line) ? [] : this._strip_comment(line).match(/([^;'"]*(('[^']*')|("[^"]*"))[^;'"]*)+|[^;'"]+/g).filter(s => s.length)
  }
  _split_args (line) { // FIXME: js regexp confuse \' with ' and \\' -> char by char ?
    return line.replace(/\s+$/, '').match(/(('[^']*')|("[^"]*"))|[^'" ]*/g).filter(s => s.length)
  }
  isValidInput (line) {
    let commands = this._split_commands(line)
    // console.log(commands)
    for (let i = 0; i < commands.length; i++) {
      let args = this._split_args(commands[i])
      if (!args.length) return false
      let cmd = this.getCommand(args.shift())
      if (!cmd) return false
      for (let i = 0; i < args.length; i++) {
        if (!ARGT._test(this, args[i], cmd.syntax[i])) return false
      }
    }
    return true
  }
  parseExec (vt, line) {
    let ret = new Seq()
    if (this._is_empty(line)) return ret
    let commands = this._split_commands(line)
    for (let i = 0; i < commands.length; i++) {
      let res = this._parseCmdLine(vt, commands[i])
      ret.append(res)
    }
    return ret
  }
  psychologist (cmd, args, line) {
    let c = this.getSimilarCommands(cmd)
    if (c.length) {
      return _('did_you_mean', c)
    }
  }
  getSimilarCommands (cmd, s) {
    s = s || this.similar_score_min
    return this.getCommands().filter(i => similarity(cmd, i) >= s)
  }
  _parseCmdLine (vt, line) {
    let c = this
    let arrs = c._split_args(line)
    let cmdname = arrs[0]
    if (c.guessCmd) cmdname = c.guessCmd(cmdname, vt)
    let r = c.r
    let ret = ''
    // console.log('parse and execute : ', arrs, c)
    let args = c.expandArgs(arrs.slice(1))
    // find the program to launch
    let cmd = c.getCommand(cmdname)

    // test command hook eligibility when no existant cmd
    if (!cmd) {
      if (cmdname in r.cmd_hook) {
        r.fire(vt, cmdname + '_cmd_hook', args, 0)
        re = r.cmd_hook[cmd](args)
        if ('ret' in re) {
          ret = re.ret
        }
      } else {
        // console.log(line)
        r.fire(vt, 'cmd_not_found', args, 0)
        r.fire(vt, cmdname + '_cmd_not_found', args, 0)
        ret = c.psychologist(cmdname, args, line) || _('cmd_not_found', [cmdname, this.r.name])
      }
      return ret
    }

    let result = cmd.exec(args, c, vt, cmd, arrs)
    if (result) {
      ret = result
    } else if (cmdname in r.cmd_hook) {
      ret = r.cmd_hook[cmd](args)
    }
    return ret
  }

  stringify () {
    return JSON.stringify(Vars.stringify(this.h))
  }
  static parse (str) {
    return str ? new Context(Vars.parse(JSON.parse(str))) : null
  }
}

var Vars = {
  stringify (h) {
    if (h instanceof Room) return 'r.' + h.stringify()
    if (Array.isArray(h)) return h.map(i => Vars.stringify(i))
    if (h instanceof Object) {
      let tmph = {}
      Object.keys(h).forEach((i) => {
        tmph[i] = Vars.stringify(h[i])
      })
      return tmph
    }
    return h
  },
  parse (h) {
    if (Array.isArray(h)) return h.map(i => Vars.parse(i))
    if (h instanceof Object) {
      let tmph = {}
      Object.keys(h).forEach((i) => {
        tmph[i] = Vars.parse(h[i])
      })
      return tmph
    }
    if (h.slice(0, 2) === 'r.') return Room.parse(h.slice(2))
    return h
  }
}
