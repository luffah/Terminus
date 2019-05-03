/* Terminal interface which solve completion problem */
function overide (e) {
  e.preventDefault()
  e.stopPropagation()
}

function idKey (e) {
  return (e.ctrl ? 'Ctrl+' : '') + (e.alt ? 'Alt+' : '') + (e.shift ? 'Shift+' : '') + e.key
}

function keyGet (e) {
  return {
    ctrl: e.ctrlKey,
    shift: e.shiftKey,
    alt: e.altKey,
    key: e.key || String.fromCharCode(e.keyCode)
  }
}

function cmpKey (ed, e) {
  /* eslint-disable */
  return (!(
    (ed.shift != e.shift) ||
    (ed.ctrl != e.ctrl) ||
    (ed.alt != e.alt) ||
    (ed.key !== e.key)
  ))
  /* eslint-enable */
}

function Waiter () {
  /// How to see some interface is busy to do things : i don't know
  /// so i add a busy state
  this.waiting_fus = []
  this.busy = false
  this.wait_free = (fu) => { this.waiting_fus.push(fu) }
  this.loop_waiting = () => {
    var wcnt = 0; var t = this
    if (!t.waiting_interval) {
      /// check every .5 second
      /// if busy then pass
      /// if not, then try run waiting actions
      /// if no action is found, then continue checking
      ///                        during 5 second
      t.waiting_interval = setInterval(function () {
        if (t.busy) {
          wcnt = 0
        } else if ((t.waiting_fus.length > 0)) {
          let fu = t.waiting_fus.shift()
          if (fu) fu(t)
        } else {
          wcnt++
          if (wcnt > 10) {
            clearInterval(t.waiting_interval)
          }
        }
      }, 500)
    }
  }
}

/*  HINTS
 *  use a vterm : let vt = new VTerm(document.body)
 *  set context : vt.ctx =  new Context(ctxdef)
 *  // see the Context class for more info
 *  // Context shall implements :
 *  //   .getCommands() -> list of possible commands
 *  //   .hasRightForCommand(cmd)
 *  //   .r -> the current directory
 *  to disable stdout  : vt.cmdoutput = false
 *  to set cursor position : vt.input.selectionStart = pos
 *  to modify line : vt.line = str
 *  to clear : vt.clear()
 *  to mute sound : vt.mute = true
 */
class VTerm {
  get SAFE_BROKEN_TEXT () { return true }

  constructor (el, ctx) {
    let v = this
    /* non dom properties */
    v.ctx = ctx || new Context()
    v.msgidx = 0
    v.histindex = 0
    v.stdin = ''
    v.stdout = ''
    v.stderr = ''
    v.returncode = 0
    v.imgs = {}
    v.statkey = {}
    v.history = []
    v.disabled = {}
    v.effects = { key: {} }
    v.timeout = { scrl: 100, ask: 600 }
    // v.charduration = 26.25
    v.charduration = 13.125
    v.charfactor = { char: { char: 1, voy: 3, tag: 10, ' ': 25, ' ': 2, '!': 10, '?': 10, ',': 5, '.': 8, '\t': 2, '\n': 10 } }
    v.charhtml = { ' ': '&nbsp;', '\n': '<br>', '\t': '&nbsp;&nbsp;' }
    v.enterKey = v.enter
    v.complete_opts = { case: 'i', normalize: noAccents, humanized: true }

    v.scrl_lock = false
    v.cmdoutput = true
    v.suggestion_selected = null

    /* dom properties (view) */
    /*
     * body
     *   .----------------------.
     *  | ghost_monitor > msg*  |
     *  '-----------------------'
     *   .---------------------------.
     *  | container                  |
     *  |  .-----------------.       |
     *  | | monitor > msg*   |       |
     *  | '------------------'       |
     *  |  .------------------------.|
     *  | | inputcontainer          || --> define if position is relative or fixed
     *  | |  .---------------------.||
     *  | | | inputdiv             ||| --> define user inventory style and offset
     *  | | |  .-----------------. |||
     *  | | | | cmdline          | ||| --> define input style
     *  | | | |  .-------------. | |||
     *  | | | | | inputline    | | |||
     *  | | | | | [ prompt  ]  | | |||
     *  | | | | | [ input   ]  | | |||
     *  | | | | '--------------' | |||
     *  | | | |  .-------------. | |||
     *  | | | | | belt         | | |||
     *  | | | | | [ buttons ]  | | |||
     *  | | | | | [suggestions]| | |||
     *  | | | | '--------------' | |||
     *                          */
    let accessible = { role: 'log', 'aria-live': 'polite' }
    // for screen reader, to remove if there is an alternative
    v.ghost_monitor = prEl(dom.body, 'div', inject({ class: 'ghost-monitor' }, accessible))

    v.container = el
    v.monitor = addEl(el, 'div', 'monitor')
    v.inputcontainer = addEl(el, 'div', 'input-container')
    v.inputdiv = addEl(v.inputcontainer, 'div', 'input-div')
    v.cmdline = addEl(v.inputdiv, 'p')
    v.inputline = addEl(v.cmdline, 'p', inject({ class: 'input' }, accessible))
    v.PS1 = addEl(v.inputline, 'span')
    v.input = addEl(v.inputline, 'input', { size: 80 })
    v.belt = addEl(v.cmdline, 'div', 'belt')
    v.buttons = addEl(v.belt, 'div', 'keys')
    v.suggestions = addEl(v.belt, 'div', inject(
      { class: 'suggest', 'aria-relevant': 'additions removals' }, accessible))

    // buttons
    let k = v.buttons
    v.btn_clear = addBtn(k, 'key', '✗', v.ctx.km.clear.name, (e) => {
      v.line = ''; v.showSuggestions(v.ctx.getCommands().map(addspace))
    })
    v.btn_tab = addBtn(k, 'key', '↹', v.ctx.km.tab.name, (e) => { v.makeSuggestions() })
    v.btn_enter = addBtn(k, 'key', '↵', v.ctx.km.enter.name, (e) => { v.enterKey() })
    //
    Waiter.call(v)
    v.behave()
    v.disableInput()
  }

  get line () { return this.input.value.replace(/\s+/, ' ') }
  set line (s) { this.input.value = s }

  clear () {
    this.monitor.innerHTML = ''
    setTimeout(() => window.scroll(0, 0), this.timeout.scroll)
  }
  // Scroll the window to the last element (bottom of page)
  // TODO: replace with a function which focus on 'active' element
  scrl (timeout, retry = 2) {
    let v = this
    // let m = v.monitor
    // let hm = m.parentNode.offsetTop + m.offsetTop + m.offsetHeight
    let poffset = window.pageYOffset + window.innerHeight
    // let hi = v.inputdiv.offsetHeight
    // let y =  hm + hi - poffset
    let deltay = v.inputdiv.offsetParent.offsetTop + v.inputdiv.offsetHeight - poffset
    if (deltay > 0) {
      if (!def(timeout) && v.scrl_lock) {
        timeout = v.timeout.scrl
      }
      if (timeout) {
        retry--
        if (retry > 0) {
          setTimeout(() => v.scrl(0, retry), timeout)
        }
      } else {
        window.scrollBy(0, deltay)
      }
    }
  }
  /* Setups */
  disableInput () { // disable can act as a mutex, if a widget don't get true then it shouldn't enable input
    let v = this
    if (!v.disabled.input) {
      v.disabled.input = true
      v.btn_clear.setAttribute('disabled', '')
      v.btn_tab.setAttribute('disabled', '')
      v.inputdiv.removeChild(v.cmdline)
      return true
    }
    return false
  }
  enableInput () {
    let v = this
    if (v.disabled.input) {
      v.disabled.input = false
      v.inputdiv.insertBefore(v.cmdline, v.inputdiv.childNodes[0])
      v.btn_clear.removeAttribute('disabled')
      v.btn_tab.removeAttribute('disabled')
      v.enterKey = v.enter
      v.input.focus()
      return true
    }
    return false
  }
  /* live ui */
  _showPrevPrompt (txt) {
    let prt = this.PS1.cloneNode(true)
    let prev = addEl(this.monitor, 'p', 'input')
    prev.appendChild(prt)
    prev.appendChild(dom.Txt(txt))
    this.PS1.innerHTML = this.ctx.PS1
  }

  _showChars (msgidx, msg, txttab, cb, txt, curvoice, opt) {
    let v = this
    if (v.kill && !opt.unbreakable) {
      v.playSound('brokentext')
      if (opt.brokencb) {
        opt.brokencb()
      }
      if (v.SAFE_BROKEN_TEXT || opt.safe) {
        if (cb) { cb() }
        if (opt.cb) { opt.cb() }
      }
      v.busy = false
      v.printing = false
    } else if ((v.msgidx !== msgidx) || (v.charduration === 0) || opt.direct) {
      msg.innerHTML = txt
      v.scrl()
      if (cb) { cb() }
      if (opt.cb) { opt.cb() }
      v.busy = false
      v.printing = false
    } else {
      let l = txttab.shift()
      if (l) {
        let timeout = 0
        if (l instanceof Node) {
          if (l.nodeName === 'VOICE') {
            curvoice = l.innerText
          } else {
            timeout = get(v.charfactor[curvoice], 'tag') || v.charfactor.char.tag
            msg.appendChild(l)
          }
        } else {
          let el = dom.El('span')
          el.innerHTML = v.charhtml[l] || l
          msg.appendChild(el)
          if (l.length > 1) {
            timeout = get(v.charfactor[curvoice], 'voy') || v.charfactor.char.voy
            v.playSound(curvoice)
          } else {
            let f = get(v.charfactor[curvoice], l) || v.charfactor.char[l]
            v.playSound(def(f) ? l : curvoice)
            timeout = f || v.charfactor.char.char
            if (l === '\n') v.scrl()
          }
        }
        setTimeout(function () {
          v._showChars(msgidx, msg, txttab, cb, txt, curvoice, opt)
        }, timeout * v.charduration)
      } else {
        v.playSound('endoftext')
        if (cb) { cb() }
        if (opt.cb) { opt.cb() }
        v.busy = false
        v.printing = false
      }
    }
  }
  echo (mesg, opt) {
    let v = this
    if (def(mesg)) {
      if (mesg instanceof Array) {
        for (let m in mesg) {
          v.echo(mesg[m], opt)
        }
        return v
      }
      opt = opt || {}
      var cb
      v.busy = v.printing = true
      v.loop_waiting()
      v.current_msg = addEl(opt.el || v.monitor, 'p', 'msg' + ' ' + (opt.cls || ''))
      if (typeof mesg === 'string') {
        mesg = _stdout(mesg)
      } else if (typeof mesg === 'number') {
        mesg = _stdout(String(mesg))
      } else if (mesg instanceof Node) {
        v.current_msg.appendChild(mesg)
      }
      // FIXME
      // work arounded -- std / err flux shall be separated...
      let msg = ''
      v.stdout = ''
      v.stderr = ''
      if (mesg.hasOwnProperty('stderr')) {
        v.stderr = mesg.stderr
        msg += v.stderr + '\n'
      }
      if (mesg.hasOwnProperty('stdout')) {
        v.stdout = mesg.stdout
        msg += v.stdout
      }
      if (mesg.hasOwnProperty('cb')) {
        cb = mesg.cb
      }
      //
      if (msg instanceof Node) {
        // nodeType = 1 -> div ou span ; nodeType = 3 -> textNode
        v.current_msg.appendChild(msg)
        v.blindPrint(msg)
        if (cb) { cb() }
        if (opt.cb) { opt.cb() }
        v.busy = false
      } else {
        let txt = msg.toString()// in case we have an object
        txt = txt.replace(re.hashtag, '<i class="hashtag"> $1 </i>').replace(re.voice, '<voice>$1</voice>')
        let txttab = articulate(txt)
        txt = txt.replace(re.tab, '&nbsp;&nbsp;').replace(re.br, '<br/>').replace(re.nbsp, '&nbsp;')
        v.msgidx++
        v.blindPrint(txt)
        v._showChars(v.msgidx, v.current_msg, txttab, cb, txt, 'char', opt)
      }
    }
    return v
  }
  blindPrint (txt) {
    this.ghostel = addEl(this.ghost_monitor, 'p')
    this.ghostel.innerHTML = txt.replace(re.br, '<&nbsp;><br/>'
    ).replace(re.tag, ''
    ).replace(re.quote, '"'
    ).replace(re.dots, '<br>')
  }
  /* Suggestion part */
  makeSuggestions (tabidx = -1, autocomplete = true) {
    let ret = true
    let v = this
    v.suggestions.innerHTML = ''
    let l = v.line
    let hlidxs = []
    let args = l.split(' ')
    v.suggestion_selected = null
    let idx = 0
    let offset = 0
    var pos = v.input.selectionStart
    for (; idx < args.length; idx++) {
      offset += args[idx].length + 1
      if (offset > pos) break
    }
    let tocomplete = args[idx]
    let match = []
    // which word to guess
    let trymatch = (potential, tocomplete) => {
      let tocompleterx = new RegExp('^' + v.complete_opts.normalize(tocomplete), v.complete_opts.case)
      return v.complete_opts.normalize(potential).match(tocompleterx)
    }
    if (tocomplete && idx > 0) { // at least 1 arg
      match = v.ctx.completeArgs(args, idx, tocomplete, trymatch)
    } else if (args[0].length > 0) {
      if (v.ctx.hasRightForCommand(args[0])) { // propose argument
        match = v.ctx.completeArgs(args, idx, tocomplete, trymatch)
      } else { // propose command completion
        v.ctx.getCommands().forEach((c) => { if (trymatch(c, tocomplete)) { match.push(c) } })
      }
    } else { // propose commands
      tocomplete = ''
      match = v.ctx.getCommands().map(addspace)
    }
    // find solutions
    if (match.length === 0) {
      v.line = l + '?'
      setTimeout(function () { v.line = l + '??' }, 100)
      setTimeout(function () { v.line = l }, 200)
    } else if (match.length === 1) {
      if (autocomplete) {
        let lb = tocomplete.split('/')
        lb[lb.length - 1] = match[0]
        args.splice(idx, 1, lb.join('/')) // insert value at idx
        v.line = args.join(' ').replace('././', './')// regex workaround
      } else {
        if (match[0] === tocomplete) {
          v.line = l + ' '
        }
        v.showSuggestions(match)
      }
    } else {
      let lcp = commonprefix(match)
      if (match.indexOf(lcp) > -1) {
        v.line = l + ' '
      } else if (tabidx > -1) {
        if (tabidx < match.length) {
          //          v.line = match[idx]+' '
          hlidxs[tabidx] = 'select'
          v.suggestion_selected = match[tabidx]
        } else {
          ret = false
        }
      }
      if (lcp.length > 0 && autocomplete) {
        let lb = tocomplete.split('/')
        lb[lb.length - 1] = lcp
        args.splice(idx, 1, lb.join('/'))
        v.line = args.join(' ')
      }
      v.showSuggestions(match, hlidxs)
    }
    return ret
  }
  showSuggestions (list, highlights) {
    highlights = highlights || []
    this.suggestions.innerHTML = '<div class="visually-hidden">' + _('Suggestions') + '</div>'
    for (let i = 0; i < list.length; i++) {
      this.showSuggestion(list[i], highlights[i])
    }
  }
  showSuggestion (txt, hlcls) {
    let v = this
    let c = v.ctx
    v.histindex = 0
    // console.log(txt, hlcls)
    addBtn(v.suggestions, hlcls, txt.replace(re.hashtag, '<i class="hashtag"> $1 </i>'), txt, function (e) {
      v.input.value += txt
      if (c.isValidInput(v.input.value)) {
        v.enter()
      } else {
        v.makeSuggestions(-1, false)
      }
    })
    v.scrl()
  }
  hideSuggestions () {
    this.suggestions.innerHTML = ''
  }
  /* */
  keyEffect (k) {
    let v = this
    if (v.ctx && k in v.ctx.r.effects.key) {
      v.ctx.r.effects.key[k](v)
    } else if (k in v.effects.key) {
      v.effects.key[k](v)
    }
  }
  enter () {
    // Enter -> parse and execute command
    let v = this
    v.keyEffect('Enter')
    v.playSound('enter')
    let l = v.line.replace(/\s+$/, '')
    if (l.length > 0) {
      let m = v.monitor
      v.monitor = addEl(m, 'div', 'screen')

      v.histindex = 0
      v._showPrevPrompt(v.input.value)
      v.history = v.history.filter(a => a.length)
      v.history.push(v.input.value)
      v.msgidx++

      let ret = v.ctx.parseExec(v, l)
      // console.log(ret)
      if (ret) {
        let nb = ret.length()
        if (nb > 0 && v.cmdoutput) {
          let supercb = []
          for (let i = 0; i < nb; i++) {
            supercb.push(() => {
              let idx = ret.getIdx()
              let n = ret.next()
              if (n.pic) {
                v.pushImg(n.pic, idx)
              }
              v.showImgs(idx)
              v.echo(n, { cb: supercb.shift() })
            })
          }
          supercb.shift()()
        }
        v.line = ''
        v.hideSuggestions()
      }

      v.monitor = m
    }
  }
  /*****************/
  /** Prompt behavior part **/
  /*****************/
  behave () {
    this.PS1.innerHTML = this.ctx.PS1

    // input behavior
    var v = this
    var pr = v.input
    var lastkey = [null, 0]

    dom.body.onkeydown = function (e) {
      v.busy = true
      e = e || window.event// Get event
      if (v.overapp) {
        v.overapp.onkeydown(e)
      } else if (v.choose_input || v.password_input) {
        e.preventDefault()
      } else if (v.answer_input) {
      } else {
        if (e.code.match('Arrow') && e.shiftKey) {
          e.preventDefault()
        } else {
          let focused = dom.activeElement
          if (!focused || focused !== pr) {
            pr.focus(); v.scrl()
          }
          pr.onkeydown(e)
        }
      }
    }
    dom.body.onkeyup = function (e) {
      e = e || window.event// Get event
      // console.log(e)
      if (v.overapp) {
        v.overapp.onkeyup(e)
      } else if (v.choose_input) {
        v._keyChoose(e)
      } else if (v.password_input) {
        v._keyPassword(e)
      } else if (v.answer_input) {
        v._keyAnswer(e)
      } else {
        if (e.code.match(/^(Arrow|Page)/) && e.shiftKey) {
          e.preventDefault()
        } else {
          let focused = dom.activeElement
          if (!focused || focused !== pr) {
            pr.focus(); v.scrl()
          }
          pr.onkeyup(e)
        }
      }
      v.busy = false
    }
    pr.onkeydown = function (e) {
      // console.log('down', e.ctrlKey, e.key)
      if (e.code.match(/Tab|Enter|ArrowUp|ArrowDown/)) {
        overide(e)
      } else if (e.ctrlKey) {
        if ((e.key || String.fromCharCode(e.keyCode)).match(/^[CVXYZ]$/)) {
          overide(e)
        }
      } else if (e.code.match(/Page/)) {
        window.focus()
        pr.blur()
      }
      return !e.defaultPrevented
    }
    pr.onkeyup = function (e) {
      // console.log('up', e.ctrlKey, e.key)

      let ed = keyGet(e)
      let k = idKey(ed)
      v.statkey[k] = (v.statkey[k] || 0) + 1
      if (lastkey[0] === k) { lastkey[1]++ } else { lastkey[1] = 0 }
      lastkey[0] = k

      v.hideSuggestions()
      if (cmpKey(KEYMAP.enter.e, ed)) {
        overide(e)
        if (v.suggestion_selected) {
          v.input.value += v.suggestion_selected
          v.suggestion_selected = 0
          v.makeSuggestions()
          lastkey[0] = idKey(KEYMAP.tab.e)
        } else {
          v.enter()
        }
        v.scrl()
      } else if (cmpKey(KEYMAP.tab.e, ed)) {
        overide(e)
        if (!v.makeSuggestions(lastkey[1] - 1)) lastkey[1] = 0
        v.scrl()
      } else if (cmpKey(KEYMAP.break.e, ed)) {
        overide(e)
        if (v.busy) {
          v.current_msg.innerHTML += '<br>' + KEYMAP.break.show
        } else {
          v._showPrevPrompt(v.line + KEYMAP.break.show)
        }
        v.msgidx++
        v.line = ''
      } else if (cmpKey(KEYMAP.clear.e, ed)) {
        overide(e)
        v.line = ''
      } else if (cmpKey(KEYMAP.rm_last_arg.e, ed)) {
        overide(e)
        v.line = v.line.replace(/[^ ]*\s*$/, '')
      } else if (cmpKey(KEYMAP.rm_last_word.e, ed)) {
        overide(e)
        v.line = v.line.replace(/\w+\/?\s*$/, '')
      } else if (cmpKey(KEYMAP.down.e, ed) || ed.key === 'ArrowDown') {
        if (v.histindex > 0) {
          v.histindex--
          v.line = v.history[v.history.length - 1 - v.histindex]
        }
      } else if (cmpKey(KEYMAP.up.e, ed) || k === 'ArrowUp') {
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
      } else if (KEYMAP.preserved.some((d) => cmpKey(d, ed))) {
        window.focus()
        pr.blur()
      } else if (KEYMAP.disabled.some((d) => cmpKey(d, ed))) {
        overide(e)
      }
      return !e.defaultPrevented
    }
  }
  /** extra programs **/
  exec (fu, cb) {
    let v = this
    v.line = ''
    let m = v.monitor
    //    var m = document.body;
    let cont = addEl(m, 'div', 'app-container')
    v.overapp = addEl(cont, 'div', 'app')
    v.disableInput()
    let endapp = () => {
      v.overapp.setAttribute('disabled', true)
      m.removeChild(cont)
      v.overapp = undefined
      if (cb) cb()
    }
    v.enterKey = function () { console.log('what is an overapp ?') }
    return fu(v, v.overapp, endapp)
  }
  /** Choice prompt **/
  /** TODO : add live action function option **/
  askChoose (question, choices, cb, opts = {}) {
    let v = this
    let buttons = []
    let curidx = 0
    let disabled = opts.disabled_choices || []
    let direct = opts.direct
    while (disabled.indexOf(curidx) > -1) {
      curidx++
    }
    let choicebox = addEl(v.monitor, 'div', 'choicebox')
    v.echo(question, { direct: direct, el: choicebox })

    v.line = ''
    v.choose_input = addEl(choicebox, 'fieldset', 'choices')
    let reenable = v.disableInput()

    let click = function (e) {
      let i = e.target.getAttribute('idx')
      addAttrs(buttons[curidx], { checked: '' })
      addAttrs(buttons[i], { checked: 'checked' })
      curidx = i
      return v.enterKey()
    }
    let onkeydown = (e) => {
      v._keyChoose(e)
    }
    v.enterKey = function (e) {
      v.playSound('choiceselect')
      v.choose_input.value = choices[curidx]
      v.echo(choices[curidx], { direct: direct, el: choicebox, unbreakable: true })
      choicebox.removeChild(v.choose_input)
      v.choose_input = undefined
      if (reenable) { v.enableInput() }
      setTimeout(() => v.echo(cb(v, curidx), { direct: direct }), v.timeout.ask)
    }
    v._keyChoose = function (e) {
      let k = e.code
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Tab') {
        v.playSound('choicemove')
        buttons[curidx].removeAttribute('checked')
        if (k === 'ArrowDown' || (!e.shiftKey && k === 'Tab')) {
          curidx = ((++curidx) % buttons.length)
          while (disabled.indexOf(curidx) > -1) {
            curidx = ((++curidx) % buttons.length)
          }
        } else if (k === 'ArrowUp' || (e.shiftKey && k === 'Tab')) {
          curidx = (--curidx >= 0 ? curidx : (buttons.length - 1))
          while (disabled.indexOf(curidx) > -1) {
            curidx = (--curidx >= 0 ? curidx : (buttons.length - 1))
          }
        }
        addAttrs(buttons[curidx], { checked: 'checked' })
        buttons[curidx].focus()
        v.ghostel.innerHTML = choices[curidx]
      } else if (k === 'Enter') {
        v.enterKey()
      }
      e.preventDefault()
    }

    for (let i = 0; i < choices.length; i++) {
      if (disabled.indexOf(i) === -1) {
        let cho = addEl(v.choose_input, 'div', 'choice')
        buttons.push(
          addEl(cho, 'input', {
            type: 'radio',
            name: 'choose',
            idx: i,
            id: 'radio' + i,
            role: 'log',
            'aria-live': 'polite',
            'aria-relevant': 'all',
            onclick: click,
            onkeydown: onkeydown
          })
        )

        addEl(cho, 'span', 'selectpointer')
        addEl(cho, 'label', {
          for: 'radio' + i
        }).innerHTML = choices[i].replace(re.hashtag, '<i class="hashtag"> $1 </i>')
      } else {
        buttons.push(null)
      }
    }
    v.choose_input.onkeydown = onkeydown
    addAttrs(v.choose_input, { value: choices[curidx] })
    addAttrs(buttons[curidx], { checked: 'checked' })
    //    buttons[0].focus();
    v.scrl()
  }
  /** Question prompt **/
  ask (question, cb, args) {
    let v = this
    v.line = ''
    let reenable = v.disableInput()
    let choicebox = addEl(v.monitor, 'div', args.cls || 'choicebox')
    let createAnswer = () => {
      v.answer_input = (args.multiline
        ? addEl(choicebox, 'textarea', { cols: 78 })
        : addEl(choicebox, 'input', { size: 78 })
      )
      addBtn(addEl(choicebox, 'div', 'keys'), 'key', '↵', 'Enter', function (e) { v.enterKey() })
      v.answer_input.value = args.value || ''
      v.answer_input.placeholder = args.placeholder || ''
      v.answer_input.readOnly = args.readOnly || false
      v.answer_input.focus()
      v.scrl()
      v.answer_input.onkeyup = v._keyAnswer
      if (args.anykeydown) {
        v.answer_input.ondown = (e) => {
          if (e.ctrlKey && args.ctrlkeydown && args.ctrlkeydown.hasOwnProperty(e.code)) {
            args.ctrlkeydown[e.code](v, e)
          } else if (args.keydown && args.keydown.hasOwnProperty(e.code)) {
            args.keydown[e.code](v, e)
          } else if (args.anykeydown) {
            args.anykeydown(v, e)
          }
        }
      }
    }
    let endAnswer = () => {
      if (args.disappear) args.disappear()
      if (reenable) v.enableInput()
    }
    let lockAnswer = () => {
      v.answer_input.setAttribute('disabled', true)
      v.answer_input = undefined
      if (args.disappear) choicebox.outerHTML = ''
    }
    v._keyAnswer = args.ev || ((e) => {
      if (e.ctrlKey && args.ctrlkeyup && args.ctrlkeyup.hasOwnProperty(e.code)) {
        args.ctrlkeyup[e.code](v, e)
      } else if (args.keyup && args.keyup.hasOwnProperty(e.code)) {
        args.keyup[e.code](v, e)
      } else if (e.code === 'Enter') {
        v.enterKey()
        e.preventDefault()
        v.scrl()
      } else if (args.anykeyup) {
        args.anykeyup(v, e)
      }
    })
    v.enterKey = () => {
      v.playSound('choiceselect')
      let ret = v.answer_input.value
      lockAnswer()
      setTimeout(() => {
        ret = cb ? cb(ret) : ret
        endAnswer()
        v.echo(ret)
      }, v.timeout.ask)
    }

    v.echo(question, { el: choicebox,
      cb: () => {
        setTimeout(createAnswer, args.wait || 0)
        if (args.timeout) {
          setTimeout(v.enterKey, (args.wait || 0) + args.timeout)
        }
      } })
  }
  /** Password prompt **/
  /** TODO : maybe, add live action function option **/
  askPassword (cmdpass, cb) {
    this._beginPassword()
    this._askPasswords(cmdpass, cb)
  }
  _beginPassword () {
    let v = this
    v.line = ''
    v._cur_box = addEl(v.monitor, 'div', 'choicebox')
    v._div = addEl(v.inputdiv, 'div', { class: 'passinput' })
    v.password_input = addEl(v._div, 'input', { size: 20 })

    v.password_input.focus()
    v.password_input.onkeyup = function (e) {
      if (e.code === 'Enter') { // ENTER
        v.enterKey()
        e.preventDefault()
        v.scrl()
      }
    }
    v.disableInput()
  }
  _endPassword () {
    let v = this
    v.inputdiv.removeChild(v._div)
    v.password_input = undefined
    v._div = undefined
    v.enableInput()
  }
  _keyPassword (e) {
  // nothing
  }
  _askPasswords (cmdpass, cb) {
    let v = this
    if (cmdpass.length > 0) {
      let p = cmdpass.shift()
      v.echo(p.question || _('ask_password'), { el: v._cur_box })
      v.enterKey = function () {
        v.playSound('choiceselect')
        let ret = v.password_input.value
        v.password_input.value = ''
        if (p.password === ret) {
          if (p.passok) {
            v.echo(p.passok, { el: v._cur_box })
          }
          v._askPasswords(cmdpass, cb)
        } else {
          if (p.passko) {
            v.echo(p.passko, { el: v._cur_box })
          }
          // v.echo(cb(false, cmdpass), { el: v._cur_box })
          v._endPassword()
        }
      }
      v.scrl()
    } else {
      // v.echo(cb(true, cmdpass))
      v._endPassword()
    }
  }
  /* -- Addons support -- */
  // SOUND
  playSound (key) {
    if (!this.mute && this.soundbank) {
      this.soundbank.play(key)
    }
  }
  playMusic (key, attrs) {
    if (!this.mute && this.musicbank) {
      this.musicbank.play(key, attrs)
    }
  }
  // IMAGES //
  mkImg (i, attrs) {
    return this.imgbank ? this.imgbank.get(i, attrs) : false
  }
  pushImg (img, idx = -1) {
    if (img) {
      if (!this.imgs[idx]) { this.imgs[idx] = [] }
      this.imgs[idx].push(img)
    }
    return this
  }
  showImgs (idx = -1) {
    let v = this
    let imgs = v.imgs[idx]
    if (imgs && imgs.length > 0) {
      let c = addEl(v.monitor, 'div', 'img-container')
      while (imgs.length) {
        imgs.shift().render(c, () => v.scrl())
      }
    }
  }
  rmCurrentImg (timeout) {
    let v = this
    setTimeout(function () {
      let y = v.current_msg.getElementsByClassName('img-container')
      let i
      for (i = 0; i < y.length; i++) {
        v.current_msg.removeChild(y[i])
      }
    }, timeout)
  }
}
