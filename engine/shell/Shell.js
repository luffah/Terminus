/* Shell interface which solve completion problem */
var CursorListener = {
  listeners : [],
  push: function(f){
    CursorListener.listeners.push(f)
  },
  fire: function(k, pos){
     CursorListener.listeners.forEach((f) => f(k, pos))
  }
}

function shRx(s) {
  let ret = ''
  let escaped = false
  let quoted = false
  for (let c of s) {
    if (escaped) {
      if (c=='\\' || c == '*') { ret += c; escaped=false }
    }
    else if (quoted) {
      ret += c
      if (c===quoted) { quoted = false }
    }
    else if (c=='\\') escaped=true
    else if (c=='"' || c=="'") { quoted = c; ret += c }
    else if (c=='*') ret += '.*'
    else ret += c
  }
  return ret
}

class Shell {
  constructor (view, env) {
    let v = this
    /* non dom properties */
    v.env = env || new Env()
    v.env.shell = v
    v.vt = view
    v.histindex = 0
    v.history = []
    v.stdin  = new TextIO(TextIO.STDIN)
    v.stdout = new TextIO(TextIO.STDOUT, (m, opt) => v.vt.render_out(m, opt))
    v.stderr = new TextIO(TextIO.STDERR, (m, opt) => v.vt.render_err(m, opt))
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
    CursorListener.fire()
  }

  emit(l, t) {
     this.vt.emit(l, t)
  }

  // echo (mesg, opt) {
    // v.emit(['MessageAdded', 'ContentAdded', 'ContentChanged'])
    // return v
  // }
  /* Suggestion part */
  makeSuggestions (tabidx = -1, autocomplete = true) {
    let v = this
    let env = v.env
    v.suggestion_selected = null
    let l = ltrim(v.line)

    /* if nothing given, propose commands */
    if (!l.length) {
      v.showSuggestions(env.getCommands().map(addspace))
      return true
    }

    let args = l.split(' ')
    let idx = 0

    /* find current word */
    let offset = 0
    var pos = v.vt.selectionStart
    for (;idx < args.length; idx++) {
      offset += args[idx].length + 1
      if (offset > pos) break
    }
    let cword = args[idx]

    let comreply = v.completeArgs(args, idx, cword)
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
        let lb = cword.split('/')
        lb[lb.length - 1] = comreply[0]
        args.splice(idx, 1, lb.join('/')) // insert value at idx
        v.line = args.join(' ').replace('././', './')// regex workaround
      } else {
        if (comreply[0] === cword) {
          v.line = l + ' '
        }
        v.showSuggestions(comreply)
      }
    } else {
      let hlidxs = []
      let lcp = commonprefix(comreply)
      if (comreply.indexOf(lcp) > -1) {
        v.line = l + ' '
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
        let lb = cword.split('/')
        lb[lb.length - 1] = lcp
        args.splice(idx, 1, lb.join('/'))
        v.line = args.join(' ')
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
    let v = this
    if (v.history.length > 0 && l == v.history[-1]) {
      return
    }
    if (l.length > 0 && l.charAt(0) != ' '){
      v.histindex = 0
      v.history = v.history.filter(a => a.length)
      v.history.push(l)
    }
  }
  parseExec (line, io) {
    let ret = new Seq()
    if (this.isEmpty(line)) return ret
    let lines = this.splitCommands(line) // shall manage INSTR ; INSTR
    for (let lo of lines) {
      let piped = lo.match(/(".*?"|[^"|]+)(?=\s*\||\s*$)/g)
      if (piped) {
        let io_list = []

        let prev_io = io
        for (let i=(piped.length - 1); i > 0; i--){
          let ntio = new NestedTextIO(prev_io.stdout, new TextIO(), prev_io.stderr)
          prev_io = ntio
          io_list.push(ntio)
        }
        io_list.push(new NestedTextIO(prev_io.stdout, io.stdout, prev_io.stderr))
        for (let i=0; i < piped.length; i++){
          let res = this.parseCmdLine(piped[i], io_list[i])
          ret.append(res)
        }
      } else {
          let res = this.parseCmdLine(lo, io)
          ret.append(res)
      }
    }
    return ret
  }
  parseCmdLine (line, io) {
    let sh = this
    let env = this.env
    let arrs = sh.splitArgs(line)
    let cmdname = arrs[0]
    if (env.guessCmd) cmdname = env.guessCmd(cmdname, this)
    let r = env.r
    let ret = ''
    console.log('parse and execute : ', arrs, io)
    let args = sh.expandArgs(arrs.slice(1))
    // find the program to launch
    let cmd = env.getCommand(cmdname)

    // test command hook eligibility when no existant cmd
    if (!cmd) {
      if (cmdname in r.cmd_hook) {
        r.fire(this, cmdname + '_cmd_hook', args, 0)
        re = r.cmd_hook[cmd](args)
        if ('ret' in re) {
          ret = re.ret
        }
      } else {
        // console.log(line)
        r.fire(this, 'cmd_not_found', args, 0)
        r.fire(this, cmdname + '_cmd_not_found', args, 0)
        ret = sh.psychologist(cmdname, args, line) || _('cmd_not_found', [cmdname, env.r.name])
      }
      if (ret.stdout) io.stdout.write(ret.stdout)
      return ret
    }

    let result = cmd.exec(args, env, io, cmd, arrs)
    if (result) {
      ret = result
    } else if (cmdname in r.cmd_hook) {
      ret = r.cmd_hook[cmd](args)
    }
    if (ret.stdout) io.stdout.write(ret.stdout)
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
    return this.env.getCommands().filter(i => similarity(cmd, i) >= s)
  }
  enter () {
    // Enter -> parse and execute command
    let v = this
    let l = trim(v.line)
    v.historize(v.line)
    v.terminateLine()

    if (l.length > 0) {
      let io = new NestedTextIO(this.stdin, this.stdout, this.stderr)
      v.busy = true
      let ret = v.parseExec(l, io)
       ret = undefined // FIXME bloquing callbacks
      // v.vt.openStdOut()
      // console.log(ret)
      if (ret && ret.length > 0) {
        let supercb = []
        for (let a of ret) {
          supercb.push(() => {
            v.emit(['ReturnStatement'], a)
            v.vt.echo(a, { cb: supercb.shift() })
          })
        }
        supercb.push(() => {
          v.busy = false
          v.renewLine()
        })
        supercb.shift()()
      } else {
          v.renewLine()
      }
      // v.vt.closeStdOut()
    } else {
      v.renewLine()
    }
  }
  /*****************/
  /** Prompt behavior part **/
  /*****************/
  SIGINT() {
    this.vt.show_sigint(KEYMAP.break.show)
  }
  validateInput() {
    let v = this
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
  nextSuggestion(){
    let v = this
    if (!v.makeSuggestions(v.lastkey_cnt - 1)) v.lastkey_cnt = 0
  }
  histRewind(){
    let v = this
    if (v.histindex < v.history.length) {
      let prev = v.history[v.history.length - 1 - v.histindex]
      if (v.histindex === 0) {
        let txt = v.line
        if (txt !== prev) {
          v.history.push(txt)
        }
      }
      v.line = prev
      v.histindex++
    }
  }
  histForward(){
    let v = this
    if (v.histindex > 0) {
      v.histindex--
      v.line = v.history[v.history.length - 1 - v.histindex]
    }
  }
  keydown(k) {
  }
  keyup(k) {
    let v = this
    v.hideSuggestions()
    if (k.is(KEYMAP.enter)) {
      v.validateInput()
    } else if (k.is(KEYMAP.tab)) {
      v.nextSuggestion()
    } else if (k.is(KEYMAP.break)) {
      if (v.busy) {
        v.SIGINT()
      } else {
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
    CursorListener.fire(k, vt.input.selectionStart)
  }
  expandArgs (args) {
    var newargs = []
    let env = this.env
    args.forEach((arg) => {
      // manage simple 'quote'
      if (re.str.test(arg)) return newargs.push(arg.slice(1, arg.length - 1))

      // manage \ (escape char)
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
      arg = arg.replace(re.escaped, escword)

      // manage env variable $VARNAME
      arg = arg.replace(re.varr, (a) => env.get[a.replace(/^\$/, '')] || '')

      // manage "double quote"
      if (re.strv.test(arg)) return newargs.push(unesc(arg.slice(1, arg.length - 1)))

      // manage quote" in "arg
      arg = arg.replace(re.strr, (a) => a.slice(1, a.length - 1))

      arg = unesc(arg)

      let xargs = []
      if (re.star.test(arg)) {
        if (re.pathstar.test(arg)) {
          let regexpArg = new RegExp(arg.replace(/\./g, '.').replace(/\*/g, '.*'))
          let room = (arg[0] == '/') ? env.cwd.getRoot() : env.cwd
          for (let f of room.find(regexpArg, 0, 1)){
              xargs.push(f.relativepath(room))
          }
        } else {
          let [room, lastcomponent, path] = env.cwd.pathToRoom(arg)
          let regexpArg = new RegExp(lastcomponent.replace(/\./g, '.').replace(/\*/g, '.*'))
          if (room && lastcomponent) {
            room.items.map(objToStr).filter((a) => regexpArg.test(a)).forEach((it) => {
              xargs.push((path + (path.length ? '/' : '') + it))
            })
          }
        }
      }
      if (xargs.length) newargs = newargs.concat(xargs.sort())
      else newargs.push(arg)
    })
    console.log(newargs)
    return newargs
  }
  completeArgs (args, idx, cword) { // return completion matches
    let v = this
    let env = v.env
    var comreply = []

    cword = shRx(cword)

    let trymatch = (potential, cword) => {
        if (!potential) return ''
        let tocompleterx = new RegExp('^' + v.complete_opts.normalize(cword), v.complete_opts.case)
        return v.complete_opts.normalize(potential).match(tocompleterx)
    }

    // console.log(args)
    let argtype = 'cmdname'
    if (idx) {
      let cmd = env.getCommand(args[0])
      if (cmd) {
        argtype = cmd.getSyntax(idx - 1)
      } else {
        argtype = 'file'
      }
    }

    if (argtype === 'cmdname') {
      var cmds = env.getCommands()
      console.log(cmds)
      cmds.forEach((i) => {
        if (trymatch(i, cword)) {
          comreply.push(i + ((i === cword) ? ' ' : ''))// if uniq, then go to next arg
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
      let roomCurrent = cword.substring(0, 1) === '~' ? env.get.HOME : env.cwd
      let path = cword.split('/')
      if (argtype === 'dir' && path.length === 1 && path[0].length === 0) {
        comreply.push('..')
      }
      for (let i = 0; i < path.length; i++) {
        roomNext = roomCurrent.getDir(path[i], env)
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
            roomCurrent.children.forEach((env) => {
              if (trymatch(env.name, path[i])) {
                comreply.push(env.name + '/')
              }
            })
            // Compare to this room's items
            if (argtype !== 'dir') {
              roomCurrent.items.forEach((it) => {
                if (trymatch(it.name, path[i])) { comreply.push(it.name) }
              })
            }
          }
        }
      }
    }
    return comreply
  }
  stripComment (line) { // FIXME: js regexp confuse \' with ' and \\' -> char by char ?
    let comment = (line.match(/((('[^']*')|("[^"]*")))|#.*/g) || []).pop()
    return (comment && comment.startsWith('#')) ? line.replace(comment, '') : line
  }
  isEmpty (line) {
    line = line.replace(/\s*/, '')
    if (line.length === 0 || line.startsWith('#')) return true
  }
  splitCommands (line) { // FIXME: js regexp confuse \' with ' and \\' -> char by char ?
    return this.isEmpty(line) ? [] : this.stripComment(line).match(/([^;'"]*(('[^']*')|("[^"]*"))[^;'"]*)+|[^;'"]+/g).filter(s => s.length)
  }
  splitArgs (line) { // FIXME: js regexp confuse \' with ' and \\' -> char by char ?
    return line.replace(/\s+$/, '').match(/(('[^']*')|("[^"]*"))|[^'" ]*/g).filter(s => s.length)
  }
  isValidInput (line) {
    let lines = this.splitCommands(line)
    // console.log(commands)
    for (let l of lines) {
      let args = this.splitArgs(l)
      if (!args.length) return false
      let cmd = this.getCommand(args.shift())
      if (!cmd) return false
      for (let i = 0; i < args.length; i++) {
        if (!ARGT._test(this, args[i], cmd.syntax[i])) return false
      }
    }
    return true
  }
  /** extra programs  // curse ???? **/
  // exec (fu, cb) {
  //   let v = this
  //   v.line = ''
  //   let m = v.monitor
  //   //    var m = document.body;
  //   let cont = addEl(m, 'div', 'app-container')
  //   v.overapp = addEl(cont, 'div', 'app')
  //   v.disableInput()
  //   let endapp = () => {
  //     v.overapp.setAttribute('disabled', true)
  //     m.removeChild(cont)
  //     v.overapp = undefined
  //     if (cb) cb()
  //   }
  //   v.enterKey = function () { console.log('what is an overapp ?') }
  //   return fu(v, v.overapp, endapp)
  // }
}
Object.assign(Shell.prototype, waiterMixin)
