/* Shell interface which solve completion problem */
function shRx (s) {
  let ret = ''
  let escaped = false
  let quoted = false
  for (const c of s) {
    if (escaped) {
      if (c == '\\' || c == '*') { ret += c; escaped = false }
    } else if (quoted) {
      ret += c
      if (c === quoted) { quoted = false }
    } else if (c == '\\') escaped = true
    else if (c == '"' || c == "'") { quoted = c; ret += c } else if (c == '*') ret += '.*'
    else ret += c
  }
  return ret
}

// --
class Shell {
  constructor (view, env, ptask) {
    const v = this
    /* non dom properties */
    v.env = env || new Env()
    v.env.sh = v
    v.vt = view
    v.histindex = 0
    v.history = []
    v.stdin = new TextIO(TextIO.STDIN, 0, (func, cb) => v.vt.read(func, cb))
    v.stdout = new TextIO(TextIO.STDOUT, (m, opt, cb) => v.vt.render_out(m, opt, cb))
    v.stderr = new TextIO(TextIO.STDERR, (m, opt, cb) => v.vt.render_err(m, opt, cb))
    v.similar_score_min = 0.5
    v.returncode = 0
    v.lastkey = null
    v.lastkey_cnt = 0
    v.timeout = { scrl: 100, ask: 600 }
    v.busy = false
    v.enterKey = v.enter
    v.complete_opts = { case: 'i', normalize: noAccents, humanized: true }
    v.cmdoutput = true
    v.suggestion_selected = null
    v.task = new Task(ptask)
  }

  get line () { return this.vt.line }

  set line (s) { this.vt.line = s }

  clear () {
    this.vt.clear()
  }

  terminateLine (k) {
    this.vt.terminateLine(k)
    this.hideSuggestions()
  }

  renewLine () {
    this.vt.renewLine(this.env.PS1)
  }

  emit (l, t) {
    this.vt.emit(l, t)
  }

  // echo (mesg, opt) {
  // v.emit(['MessageAdded', 'ContentAdded', 'ContentChanged'])
  // return v
  // }
  /* Suggestion part */
  makeSuggestions (tabidx = -1, autocomplete = true) {
    const v = this
    const env = v.env
    v.suggestion_selected = null
    const l = ltrim(v.line)

    /* if nothing given, propose commands */
    if (!l.length) {
      v.showSuggestions(env.getCommands().map(addspace))
      return true
    }

    /* find current word and args */
    const offset = 0
    var pos = v.vt.selectionStart
    let cmdbefore = l.slice(0, pos + 1)
    const cmdafter = l.slice(pos + 1)
    const cmdcurrent = v.splitPipe(v.splitCommands(cmdbefore).pop()).pop()
    cmdbefore = cmdbefore.slice(0, cmdbefore.length - cmdcurrent.length)
    if (cmdbefore.slice(-1) == '|') cmdbefore += ' '
    const args = v.splitArgs(cmdcurrent)
    let idx = args.length
    let cword = ''
    if (cmdcurrent.slice(-1) !== ' ') cword = args[--idx]

    const comreply = v.completeArgs(args, idx, cword)
    // find solutions
    if (comreply.length === 0) {
      v.line = l + '?'
      setTimeout(function () { v.line = l + '??' }, 100)
      setTimeout(function () { v.line = l }, 200)
      return false
    }
    let ret = true
    if (comreply.length === 1) {
      if (autocomplete) {
        const lb = cword.split('/')
        lb[lb.length - 1] = comreply[0]
        args.splice(idx, 1, lb.join('/')) // insert value at idx
        v.line = cmdbefore + args.join(' ').replace('././', './') + cmdafter
      } else {
        if (comreply[0] === cword && cmdafter.length == 0) {
          v.line = l + ' '
        }
        v.showSuggestions(comreply)
      }
    } else {
      const hlidxs = []
      const lcp = commonprefix(comreply)
      if (comreply.indexOf(lcp) > -1) {
        v.line = cmdbefore + ' ' + cmdafter
      } else if (tabidx > -1) {
        if (tabidx < comreply.length) {
          //          v.line = comreply[idx]+' '
          hlidxs[tabidx] = 'select'
          v.suggestion_selected = comreply[tabidx]
        } else {
          ret = false
        }
      }
      if (lcp.length > 0 && autocomplete) {
        const lb = cword.split('/')
        lb[lb.length - 1] = lcp
        args.splice(idx, 1, lb.join('/'))
        v.line = cmdbefore + args.join(' ') + cmdafter
      }
      v.showSuggestions(comreply, hlidxs)
    }
    return ret
  }

  showSuggestions (list, highlights) {
    this.vt.showSuggestions(list, highlights)
    this.emit(['SuggestionUpdate'])
  }

  hideSuggestions () {
    this.vt.hideSuggestions()
  }

  historize (l) {
    const v = this
    if (v.history.length > 0 && l == v.history[-1]) {
      return
    }
    if (l.length > 0 && l.charAt(0) != ' ') {
      v.histindex = 0
      v.history = v.history.filter(a => a.length)
      v.history.push(l)
    }
  }

  execCmdLine (line, io, endline) { // INSTR; INSTR | INSTR
    // only manage pipe; FIXME: < > || &&
    const v = this
    if (v.isEmpty(line)) return
    const lines = new Seq(v.splitCommands(line)) // shall manage INSTR ; INSTR

    const execInstr = function (lo, end) {
      const piped = v.splitPipe(lo) // --> ['INSTR', '|', 'INSTR']
      if (piped[piped.length - 1] == '|') { endline(); return 1 }
      // TODO: erreur symbole inattendu
      if (piped.length > 1) {
        const cmds = []
        let prev = ''
        for (const c of piped) {
          if (c === '|') { if (prev === '|') { endline(); return 1 } } else cmds.push(c.trim())
          prev = c
        }
        let ntio = new NestedTextIO(io.stdin, new TextIO(), io.stderr)
        let prev_io = ntio
        const io_list = [ntio]
        for (let i = 1; i < cmds.length - 1; i++) {
          ntio = new NestedTextIO(prev_io.stdout, new TextIO(), prev_io.stderr)
          prev_io = ntio
          io_list.push(ntio)
        }
        io_list.push(new NestedTextIO(prev_io.stdout, io.stdout, prev_io.stderr))
        for (let i = 0; i < cmds.length; i++) {
          // console.log(cmds[i],'take', io_list[i])
          v.execInstr(cmds[i], io_list[i], end)
        }
      } else v.execInstr(lo, io, end)
    }
    lines.run((lo, next) => {
      execInstr(lo, (i, re) => {
        // console.log('returncode' ,i)
        v.returncode = i
        if (re) v.emit(['ReturnStatement'], re)
        next()
      })
    }, endline)
    return v.returncode
  }

  execInstr (line, io, returncode) { // INSTR -- does print to stderr stdout
    const sh = this
    const env = this.env
    const arrs = sh.splitArgs(line)
    let cmdname = arrs[0]
    if (env.guessCmd) cmdname = env.guessCmd(cmdname, this)
    const r = env.cwd
    let ret = null
    // console.log('parse and execute : ', arrs, io)
    const args = sh.expandArgs(arrs.slice(1))
    // find the program to launch
    const cmd = env.getCommand(cmdname)
    let function_name = (cmd ? cmd.function_name: cmdname)
 
    io.fire = (fireables, evt) => {
      fireables.forEach((f) => {
        f[0].fire(evt ? cmdname + '_' + evt : cmdname, args, env,  io, f[1])
        if (cmdname != function_name){
          f[0].fire(evt ? function_name + '_' + evt : function_name, args, env, io, f[1])
        }
      })
    }
    io.push = (re) => {
      let cb;
      if (re.fireables) {
        cb = () => {
          io.fire(re.fireables, 'done')
        }
      }
      if (re.render) sh.emit(['Render'], re)
      if (re.stderr) io.stdout.write(re.stderr)
      if (re.stdout) io.stdout.write(re.stdout, {}, cb)
      else if (cb) cb()
    }
    io.exec = (line) => {
      const l = trim(line)

      if (l.length > 0) {
        const nio = new NestedTextIO(io.stdin, io.stdout, io.stderr)
        sh.execCmdLine(l, nio,
          () => { console.log('TODO SUB COMMAND ENDING???') }
        )
      }
    }
    io.askpass = (pass, opt) => {
      // TODO : VTERM ---
    }

    const task = new Task(sh.task, returncode, line, cmd, args, env, io)

    if (!cmd) { // test if there is a hook for the command name
      if (cmdname in r.cmd_hook) {
        r.fire(this, cmdname + '_cmd_hook', args, 0)
        ret = r.cmd_hook[cmdname](args)
        if ('ret' in ret) ret = ret.ret
      } else {
        r.fire(this, 'cmd_not_found', args, 0)
        r.fire(this, cmdname + '_cmd_not_found', args, 0)
        ret = sh.psychologist(cmdname, args, line) || _('cmd_not_found', [cmdname, env.cwd.name])
        if (typeof ret === 'string') ret = { stdout: ret }
      }
    // } else {
    //   let hret
    //   if (cmd.hookable) {
    //     hret = r.tryhook(cmdname, args, cmd)
    //   }
    //   if (hret && hret.ret) ret = hret.ret
    //   if (!(hret && hret.ret && !hret.continue)){
    //     ret = cmd.exec(args, env, io, cmd, arrs)
    //   }
    }
    let retcode = 0
    if (ret) {
      // à revoir
      if (ret instanceof Task) {
        ret.exit = returncode
        return
      }
      ret = new Seq(ret)
      // console.log(ret)
      ret.run((re, next) => {
        // FIXME : use io.push(re) instead
        // FIXME : make task exit use next()

        if (re.code) retcode = re.code
        if (re.stdout) (io.stdout.write(re.stdout, re, next))
        if (re.stderr) (io.stderr.write(re.stderr, re, next))
        if (re.fireables) {
          ret.cb = () => {
            io.fire(re.fireables, 'done')
          }
          // ret.cb()
        }
        sh.emit(['ReturnStatement'], re)
      }, () => { returncode(retcode, ret) })
    } else { returncode(retcode) }
  }

  psychologist (cmd, args, line) {
    const c = this.getSimilarCommands(cmd)
    if (c.length) {
      return _('did_you_mean', c)
    }
  }

  getSimilarCommands (cmd, s) {
    s = s || this.similar_score_min
    return this.env.getCommands().filter(i => similarity(cmd, i) >= s)
  }

  enter () {
    // Enter -> parse and execute command
    const v = this
    const l = trim(v.line)
    v.historize(v.line)
    v.terminateLine()

    if (l.length > 0) {
      const io = new NestedTextIO(this.stdin, this.stdout, this.stderr)
      v.busy = true
      v.execCmdLine(l, io,
        () => {
          v.emit(['CmdLineDone'], v)
          v.busy = false
          v.renewLine()
        }
      )
    } else {
      v.renewLine()
    }
  }

  /*****************/
  /** Prompt behavior part **/
  /*****************/
  SIGINT () {
    this.vt.show_sigint(KEYMAP.break.show)
  }

  validateInput () {
    const v = this
    if (v.suggestion_selected) {
      v.line += v.suggestion_selected
      v.suggestion_selected = 0
      v.makeSuggestions()
      v.lastkey = 'Tab'
      return false
    }
    v.enter()
    return true
  }

  nextSuggestion () {
    const v = this
    if (!v.makeSuggestions(v.lastkey_cnt - 1)) v.lastkey_cnt = 0
  }

  histRewind () {
    const v = this
    if (v.histindex < v.history.length) {
      const prev = v.history[v.history.length - 1 - v.histindex]
      if (v.histindex === 0) {
        const txt = v.line
        if (txt !== prev) {
          v.history.push(txt)
        }
      }
      v.line = prev
      v.histindex++
    }
  }

  histForward () {
    const v = this
    if (v.histindex > 0) {
      v.histindex--
      v.line = v.history[v.history.length - 1 - v.histindex]
    }
  }

  keydown (k) {
  }

  validateRead () {
    this.vt.validateRead()
  }

  keyup (k, readline) {
    const v = this
    v.hideSuggestions()
    if (k.is(KEYMAP.enter)) {
      if (readline) v.validateRead()
      else v.validateInput()
    } else if (k.is(KEYMAP.tab)) {
      if (readline) v.line += '\t'
      else v.nextSuggestion()
    } else if (k.is(KEYMAP.break)) {
      if (readline) v.vt.readEnd(KEYMAP.break)
      else if (v.busy) v.SIGINT()
      else {
        v.terminateLine(KEYMAP.break)
        v.renewLine()
      }
    } else if (k.is(KEYMAP.clear)) {
      v.line = ''
    } else if (k.is(KEYMAP.rm_last_arg)) {
      v.line = v.line.replace(/[^ ]*\s*$/, '')
    } else if (k.is(KEYMAP.rm_last_word)) {
      v.line = v.line.replace(/\w+\/?\s*$/, '')
    } else if (k.is(KEYMAP.down, 'ArrowDown')) {
      v.histForward()
    } else if (k.is(KEYMAP.up, 'ArrowUp')) {
      v.histRewind()
    }
  }

  expandArgs (args) {
    var newargs = []
    const env = this.env
    args.forEach((arg) => {
      // manage simple 'quote'
      if (re.str.test(arg)) return newargs.push(arg.slice(1, arg.length - 1))

      // manage \ (escape char)
      const escaped = (arg.match(re.escaped) || []).map((a) => a.replace(/^\\/, ''))
      const escword = (
        '#' + '‡†‰©š®²³µ¶¸¾½¼¿<ESCAPED;>'.repeat(5).split('').sort(randomSort).join('') + '#'
      ) // ugly way to escape chars -> we store escaped chars; replace by ESCWORD; and reset at end
      const unesc = (s) => {
        let escidx = 0
        return s.replace(
          new RegExp(escword, 'g'),
          () => { return escaped[escidx++] }
        )
      }
      arg = arg.replace(re.escaped, escword)

      // manage env variable $VARNAME
      arg = arg.replace(re.varr, (a) => env.v[a.replace(/^\$/, '')] || '')

      // manage "double quote"
      if (re.strv.test(arg)) return newargs.push(unesc(arg.slice(1, arg.length - 1)))

      // manage quote" in "arg
      arg = arg.replace(re.strr, (a) => a.slice(1, a.length - 1))

      arg = unesc(arg)

      const xargs = []
      if (re.star.test(arg)) {
        if (re.pathstar.test(arg)) {
          const regexpArg = new RegExp(arg.replace(/\./g, '.').replace(/\*/g, '.*'))
          const room = (arg[0] == '/') ? env.cwd.root : env.cwd
          for (const f of room.find(regexpArg, 0, 1)) {
            xargs.push(f.relativepath(room))
          }
        } else {
          const [room, lastcomponent, path] = env.cwd.pathToRoom(arg)
          if (room && lastcomponent) {
            const regexpArg = new RegExp(lastcomponent.replace(/\./g, '.').replace(/\*/g, '.*'))
            room.items.map(objToStr).filter((a) => regexpArg.test(a)).forEach((it) => {
              xargs.push((path + (path.length ? '/' : '') + it))
            })
          }
        }
      }
      if (xargs.length) newargs = newargs.concat(xargs.sort())
      else newargs.push(arg)
    })
    // console.log(newargs)
    return newargs
  }

  completeArgs (args, idx, cword) { // return completion matches
    const v = this
    const env = v.env
    var comreply = []
    // console.log(args, idx, cword)
    cword = shRx(cword)

    const trymatch = (potential, cword) => {
      if (!potential) return ''
      const tocompleterx = new RegExp('^' + v.complete_opts.normalize(cword), v.complete_opts.case)
      return v.complete_opts.normalize(potential).match(tocompleterx)
    }

    // console.log(args)
    let argtype = 'cmdname'
    if (idx) {
      const cmd = env.getCommand(args[0])
      if (cmd) {
        argtype = cmd.getSyntax(idx - 1)
      } else {
        argtype = 'file'
      }
    }

    if (argtype === 'cmdname') {
      var cmds = env.getCommands()
      // console.log(cmds)
      cmds.forEach((i) => {
        if (trymatch(i, cword)) {
          comreply.push(i + ((i === cword) ? ' ' : '')) // if uniq, then go to next arg
        }
      })
      return comreply
    } else if (argtype === 'msgid') {
      return Object.keys(dialog).filter(function (i) {
        return i.match('^' + cword)
      }).slice(0, 20)
    } else {
      // Iterate through each room
      let roomNext
      let roomCurrent = cword.substring(0, 1) === '~' ? env.HOME : env.cwd
      const path = cword.split('/')
      if (argtype === 'dir' && path.length === 1 && path[0].length === 0) {
        comreply.push('..')
      }
      for (let i = 0; i < path.length; i++) {
        roomNext = roomCurrent.next(path[i], env)
        if (roomNext) {
          roomCurrent = roomNext
          if (i === path.length - 1) {
            comreply.push(roomNext.name + '/')
          }
        } else if (i === path.length - 1) {
          // We've made it to the final room,
          // so we should look for things to complete our journey
          // Compare to this room's children
          if (['strictfile', 'file', 'dir'].indexOf(argtype) !== -1) {
            for (const r of roomCurrent.children) {
              if (trymatch(r.name, path[i])) {
                comreply.push(r.name + '/')
              }
            }
            // Compare to this room's items
            if (argtype !== 'dir') {
              for (const it of roomCurrent.items) {
                if (trymatch(it.name, path[i])) { comreply.push(it.name) }
              }
            }
          }
        }
      }
    }
    return comreply
  }

  isEmpty (line) {
    line = line.replace(/\s*/, '')
    if (line.length === 0 || line.startsWith('#')) return true
  }

  stripComment (line) { // FIXME: js regexp confuse \' with ' and \\' -> char by char ?
    const comment = (line.match(/((('[^']*')|("[^"]*")))|#.*/g) || []).pop()
    return (comment && comment.startsWith('#')) ? line.replace(comment, '') : line
  }

  splitCommands (line) { // FIXME: js regexp confuse \' with ' and \\' -> char by char ?
    return this.isEmpty(line) ? [] : this.stripComment(line).match(/([^;'"]*(('[^']*')|("[^"]*"))[^;'"]*)+|[^;'"]+/g).filter(s => s.length)
  }

  splitArgs (line) { // FIXME: js regexp confuse \' with ' and \\' -> char by char ?
    return line.replace(/\s+$/, '').match(/(('[^']*')|("[^"]*"))|[^'" ]*/g).filter(s => s.length)
  }

  splitPipe (line) {
    return line.match(/((".*?"|[^"|]+)+)|(\s*\||\s+)/g)
  }

  isValidInput (line) {
    const lines = this.splitCommands(line)
    // console.log(commands)
    for (const l of lines) {
      const args = this.splitArgs(l)
      if (!args.length) return false
      const cmd = this.getCommand(args.shift())
      if (!cmd) return false
      for (let i = 0; i < args.length; i++) {
        if (!ARGT._test(this, args[i], cmd.syntax[i])) return false
      }
    }
    return true
  }
}
Object.assign(Shell.prototype, waiterMixin)
