/* Terminal interface which solve completion problem */
// require(['shell/Shell','shell/Key']);

var CursorListener = {
  listeners: [],
  push: function (f) {
    CursorListener.listeners.push(f)
  },
  fire: function (k, pos) {
    CursorListener.listeners.forEach((f) => f(k, pos))
  }
}

/*  HINTS
 *  use a vterm : let vt = new VTerm(document.body)
 *  set context : vt.env =  new Env(envdef)
 *  // see the Env class for more info
 *  // Env shall implements :
 *  //   .getCommands() -> list of possible commands
 *  //   .hasRightForCommand(cmd)
 *  //   .r -> the current directory
 *  to disable stdout  : vt.cmdoutput = false
 *  to set cursor position : vt.input.selectionStart = pos
 *  to modify line : vt.line = str
 *  to clear : vt.clear()
 *  to mute sound : vt.mute = true
 */
class VTerm extends Window {
  constructor (el, env) {
    super()
    const v = this
    /* non dom properties */
    v.shell = new Shell(v, env)
    v.msgidx = 0
    v.statkey = {}
    v.disabled = {}
    v.effects = { key: {} }
    v.timeout = { scrl: 100, ask: 600 }
    // v.charduration = 26.25
    v.charduration = 13.125
    v.charfactor = { char: { char: 1, voy: 3, tag: 10, ' ': 25, ' ': 2, '!': 10, '?': 10, ',': 5, '.': 8, '\t': 2, '\n': 10 } }
    v.charhtml = { ' ': '&nbsp;', '\n': '<br>', '\t': '&nbsp;&nbsp;' }
    v.enterKey = v.enter
    v.complete_opts = { case: 'i', normalize: noAccents, humanized: true }
    v.next_input_value = ''

    v.scrl_lock = false
    v.cmdoutput = true
    v.suggestion_selected = null

    /* dom properties (view) */
    /*
     * body
     *   .----------------------.
     *  | ghost_monitor > msg*  |      --> view for people who use a screen reader
     *  '-----------------------'
     *   .---------------------------.
     *  | container                  |
     *  |  .-----------------.       |
     *  | | monitor > msg*   |       | --> view for people who read the screen
     *  | '------------------'       |
     *  |  .------------------------.|
     *  | | inputcontainer          || --> define if position is relative or fixed
     *  | |  .---------------------.||
     *  | | | inputdiv             ||| --> define user inventory style and offset
     *  | | |  .-----------------. |||
     *  | | | | cmdlinecontainer | ||| --> contain  input style
     *  | | | |  .-------------. | |||
     *  | | | | | cmdline    | | |||
     *  | | | | | [ prompt  ]  | | |||
     *  | | | | | .----------. | | |||
     *  | | | | || cmdinput  | | | |||
     *  | | | | ||[ input   ]| | | |||
     *  | | | | |'-----------' | | |||
     *  | | | | '--------------' | |||
     *  | | | |  .-------------. | |||
     *  | | | | | belt         | | |||
     *  | | | | | [ buttons ]  | | |||
     *  | | | | | [suggestions]| | |||
     *  | | | | '--------------' | |||
     *                          */
    // for screen reader, to remove if there is an alternative
    v.ghost_monitor = prEl(dom.body, 'div', accessible({ class: 'ghost-monitor' }))
    v.container = el
    v.monitor = addEl(el, 'div', picturable({ class: 'monitor' }))
    v.inputcontainer = addEl(el, 'div', 'input-container')
    v.inputdiv = addEl(v.inputcontainer, 'div', 'input-div')
    v.cmdlinecontainer = addEl(v.inputdiv, 'p')
    v.cmdline = addEl(v.cmdlinecontainer, 'p', accessible({ class: 'input' }))
    v.PS1 = addEl(v.cmdline, 'span')
    v.cmdinput = addEl(v.cmdline, 'span')
    v.input = addEl(v.cmdinput, 'input', { size: 80 })
    v.belt = addEl(v.cmdlinecontainer, 'div', 'belt')
    v.buttons = addEl(v.belt, 'div', 'keys')
    v.suggestions = addEl(v.belt, 'div', accessible({ class: 'suggest', 'aria-relevant': 'additions removals' }))

    // buttons
    const k = v.buttons
    // console.log(v.env)
    v.btn_clear = addBtn(k, 'key', '✗', v.env.km.clear.name, (e) => {
      v.line = ''; v.showSuggestions(v.env.getCommands().map(addspace))
    })
    v.btn_tab = addBtn(k, 'key', '↹', v.env.km.tab.name, (e) => { v.shell.makeSuggestions() })
    v.belt.onclick = (e) => {
      v.shell.makeSuggestions()
    }
    v.btn_enter = addBtn(k, 'key', '↵', v.env.km.enter.name, (e) => { v.shell.enterKey() })
    //
    v.behave()
    v.disableInput()
    v.focus(v.input)
    // to put in a renewPrompt function
  }

  get env () { return this.shell.env }

  set env (c) { this.shell.env = c }

  get line () { return this.input.value }

  set line (s) { this.input.value = s }

  get selectionStart () { return this.input.selectionStart }

  set selectionStart (p) { this.input.selectionStart = p }

  // clear the terminal window
  clear () {
    this.monitor.innerHTML = ''
    setTimeout(() => window.scroll(0, 0), this.timeout.scroll)
  }

  /* Setups */
  /* live ui */
  _showChars (msgidx, msg, txttab, cb, end, txt, curvoice, opt) {
    const v = this
    if (v.kill && !opt.unbreakable) {
      v.playSound('brokentext')
      if (opt.brokencb) {
        opt.brokencb()
        end()
      }
      if (v.SAFE_BROKEN_TEXT || opt.safe) {
        if (cb) { cb() }
        if (opt.cb) { opt.cb() }
        if (end) { end() }
      }
      v.printing = false
    } else if ((v.msgidx !== msgidx) || (v.charduration === 0) || opt.direct) {
      msg.innerHTML = txt
      v.emit(['ContentAdded', 'ContentChanged'])
      if (cb) { cb() }
      if (opt.cb) { opt.cb() }
      if (end) { end() }
      v.printing = false
    } else {
      const l = txttab.shift()
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
          const el = dom.El('span')
          el.innerHTML = v.charhtml[l] || l
          msg.appendChild(el)
          if (l.length > 1) {
            timeout = get(v.charfactor[curvoice], 'voy') || v.charfactor.char.voy
            v.playSound(curvoice)
          } else {
            const f = get(v.charfactor[curvoice], l) || v.charfactor.char[l]
            v.playSound(def(f) ? l : curvoice)
            timeout = f || v.charfactor.char.char
            if (l === '\n') v.emit(['NewLine', 'ContentAdded'], msg)
          }
        }
        setTimeout(function () {
          v._showChars(msgidx, msg, txttab, cb, end, txt, curvoice, opt)
        }, timeout * v.charduration)
      } else {
        v.playSound('endoftext')
        if (cb) { cb() }
        if (opt.cb) { opt.cb() }
        if (end) { end() }
        v.printing = false
      }
    }
  }

  render_out (lines, opt, cb) {
    this.echo(lines, opt, cb)
  }

  render_err (lines, opt, cb) {
    this.echo(lines, opt, cb)
  }

  echo (mesg, opt, end) {
    const v = this
    if (def(mesg)) {
      if (mesg instanceof Array) {
        const last = mesg.pop()
        for (const m of mesg) {
          v.echo(m, opt)
        }
        v.echo(last, opt, end)
        return v
      }
      opt = opt || {}
      var cb
      v.printing = true
      // v.loop_waiting()
      v.current_msg = addEl(opt.el || v.monitor, 'pre', 'msg' + ' ' + (opt.cls || ''))
      if (typeof mesg === 'string') {
        mesg = { stdout: mesg }
      } else if (typeof mesg === 'number') {
        mesg = { stdout: String(mesg) }
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
        if (end) { end() }
      } else {
        let txt = msg.toString()// in case we have an object
        txt = txt.replace(re.hashtag, '<i class="hashtag"> $1 </i>').replace(re.voice, '<voice>$1</voice>')
        const txttab = articulate(txt)
        txt = txt.replace(re.tab, '&nbsp;&nbsp;').replace(re.br, '<br/>').replace(re.nbsp, '&nbsp;')
        v.msgidx++
        v.blindPrint(txt)
        v._showChars(v.msgidx, v.current_msg, txttab, cb, end, txt, 'char', opt)
      }
      v.emit(['MessageAdded', 'ContentAdded', 'ContentChanged'])
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
  showSuggestions (list, highlights) {
    highlights = highlights || []
    this.suggestions.innerHTML = '<div class="visually-hidden">' + _('Suggestions') + '</div>'
    for (let i = 0; i < list.length; i++) {
      this.addSuggestion(list[i], highlights[i])
    }
  }

  addSuggestion (txt, hlcls) {
    const v = this
    const c = v.shell
    // v.histindex = 0
    // console.log(txt, hlcls)
    addBtn(v.suggestions, hlcls, txt.replace(re.hashtag, '<i class="hashtag"> $1 </i>'), txt, function (e) {
      v.input.value += txt
      if (c.isValidInput(v.input.value)) {
        c.enter()
      } else {
        c.makeSuggestions(-1, false)
      }
    })
  }

  hideSuggestions () {
    this.suggestions.innerHTML = ''
  }

  /* */
  keyEffect (k) {
    const v = this
    if (v.env && v.env.cwd && k in v.env.cwd.effects.key) {
      v.env.cwd.effects.key[k](v)
    } else if (k in v.effects.key) {
      v.effects.key[k](v)
    }
  }

  terminateLine (k) {
    this.msgidx++
    const prev = addEl(this.monitor, 'p', 'input')
    prev.appendChild(this.PS1.cloneNode(true))
    prev.appendChild(dom.Txt(this.input.value))
    if (!k) {
      this.keyEffect('Enter')
      this.playSound('enter')
    } else {
      addEl(prev, 'span').innerHTML = k.show
    }
    // this.monitor =
    this.next_input_value = ''
    this.disableInput()
  }

  renewLine (promptHTML) {
    this.enableInput()
    CursorListener.fire()
    this.PS1.innerHTML = promptHTML
    this.input.value = this.next_input_value
  }

  show_sigint () {
    this.current_msg.innerHTML += '<br>' + KEYMAP.break.show
    this.msgidx++
  }

  /*****************/
  /** Prompt behavior part **/
  /*****************/
  behave () {
    // input behavior
    var v = this
    var pr = v.input

    v.focusInput = function () {
      v.input.focus()
      v.emit(['InputFocused'])
    }
    pr.keydown = function (e) {
      const k = new Key(e)
      v.shell.keydown(k, vt.readline)
      if (v.disabled.input) { v.msgidx += 1; v.next_input_value += k.str }
    }
    pr.keyup = function (e) {
      const k = new Key(e)
      const ks = Key.toStr(k)
      v.statkey[ks] = (v.statkey[ks] || 0) + 1
      v.shell.keyup(k, vt.readline)
      CursorListener.fire(k, v.input.selectionStart)
    }
    v.shell.renewLine()
  }

  read (func, end) {
    const v = this
    v.line = ''
    v.readline = addEl(v.inputcontainer, 'p', accessible({ class: 'input' }))
    v.readline.appendChild(v.cmdinput)
    CursorListener.fire()
    v.validateRead = function () {
      v.echo(this.input.value, { direct: true })
      if (func) func(v.line)
      v.line = ''
    }
    // console.log(end)
    v.terminateRead = end
  }

  readEnd () {
    const v = this
    v.cmdline.appendChild(v.cmdinput)
    v.inputcontainer.removeChild(v.readline)
    delete v.readline
    v.terminateRead()
    delete v.validateRead
    delete v.terminateRead
    v.line = ''
    CursorListener.fire()
  }

  disableInput () { // disable can act as a mutex, if a widget don't get true then it shouldn't enable input
    const v = this
    if (v.disabled.input) return false
    v.disabled.input = true
    v.btn_clear.setAttribute('disabled', '')
    v.btn_tab.setAttribute('disabled', '')
    v.inputdiv.removeChild(v.cmdlinecontainer)
    return true
  }

  enableInput () {
    const v = this
    if (!v.disabled.input) return false
    v.disabled.input = false
    v.inputdiv.insertBefore(v.cmdlinecontainer, v.inputdiv.childNodes[0])
    v.btn_clear.removeAttribute('disabled')
    v.btn_tab.removeAttribute('disabled')
    v.enterKey = v.enter
    v.input.focus()
    v.focus(v.input)
    v.emit(['InputFocused'])
    CursorListener.fire()
    return true
  }

  /** extra programs **/
  exec (fu, cb) {
    const v = this
    v.line = ''
    const m = v.monitor
    //    var m = document.body;
    const cont = addEl(m, 'div', 'app-container')
    v.overapp = addEl(cont, 'div', 'app')
    v.disableInput()
    const endapp = () => {
      v.overapp.setAttribute('disabled', true)
      m.removeChild(cont)
      v.overapp = undefined
      if (cb) cb()
    }
    v.enterKey = function () { console.log('extra app ?') }
    return fu(v, v.overapp, endapp)
  }

  /** Choice prompt **/
  /** TODO : add live action function option **/
  askChoose (question, choices, cb, opts = {}) {
    const v = this
    const buttons = []
    const disabled = opts.disabled_choices || []
    const direct = opts.direct
    let curidx = 0
    while (disabled.indexOf(curidx) > -1) curidx++
    const choicebox = addEl(v.monitor, 'div', 'choicebox')
    v.echo(question, { direct: direct, el: choicebox })

    v.line = ''
    v.choose_input = addEl(choicebox, 'fieldset', 'choices')

    v.focus(v.choose_input)
    const reenable = v.disableInput()

    var enterKey = function () {
      console.log('enter')
      v.playSound('choiceselect')
      v.choose_input.value = choices[curidx]
      v.echo(choices[curidx], { direct: direct, el: choicebox, unbreakable: true })
      choicebox.removeChild(v.choose_input)
      v.choose_input = undefined
      if (reenable) { v.enableInput() }
      setTimeout(() => v.echo(cb(v, curidx), { direct: direct }), v.timeout.ask)
    }
    const click = function (e) {
      console.log('click')
      const i = e.target.getAttribute('idx')
      addAttrs(buttons[curidx], { checked: '' })
      addAttrs(buttons[i], { checked: 'checked' })
      curidx = i
      enterKey()
    }
    var _keyChoose = function (e) {
      console.log('key choose')
      const k = e.code
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
        enterKey()
      }
      e.preventDefault()
    }

    for (let i = 0; i < choices.length; i++) {
      if (disabled.indexOf(i) === -1) {
        // console.log(i)
        const cho = addEl(v.choose_input, 'div', 'choice')
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
            // keydown: onkeydown
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
    v.choose_input.keydown = _keyChoose
    v.choose_input.keyup = () => null
    addAttrs(v.choose_input, { value: choices[curidx] })
    addAttrs(buttons[curidx], { checked: 'checked' })
    //    buttons[0].focus();
    v.emit(['askChoose', 'ContentAdded', 'ContentChanged'])
  }

  /** Question prompt **/
  ask (question, cb, args) {
    const v = this
    v.line = ''
    const reenable = v.disableInput()
    const choicebox = addEl(v.monitor, 'div', args.cls || 'choicebox')
    const createAnswer = () => {
      v.answer_input = (args.multiline
        ? addEl(choicebox, 'textarea', { cols: 78 })
        : addEl(choicebox, 'input', { size: 78 })
      )
      addBtn(addEl(choicebox, 'div', 'keys'), 'key', '↵', 'Enter', function (e) { v.enterKey() })
      v.answer_input.value = args.value || ''
      v.answer_input.placeholder = args.placeholder || ''
      v.answer_input.readOnly = args.readOnly || false
      v.answer_input.focus()
      v.emit(['InputFocused', 'ContentAdded', 'ContentChanged'])
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
    const endAnswer = () => {
      if (args.disappear) args.disappear()
      if (reenable) v.enableInput()
    }
    const lockAnswer = () => {
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
      v.emit(['AnswerGiven', 'ContentChanged'])
    }

    v.echo(question, { el: choicebox,
      cb: () => {
        setTimeout(createAnswer, args.wait || 0)
        if (args.timeout) {
          setTimeout(v.enterKey, (args.wait || 0) + args.timeout)
        }
      } })
  }

  playSound () { /* hook me */ }

  playMusic () { /* hook me */ }
}

VTerm.prototype.SAFE_BROKEN_TEXT = true
Object.assign(VTerm.prototype, addonMixin)
Object.assign(VTerm.prototype, eventEmitterMixin)
