/* Terminal interface which solve completion problem */

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
    let v = this
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
    // for screen reader, to remove if there is an alternative
    v.ghost_monitor = prEl(dom.body, 'div', accessible({ class: 'ghost-monitor' }))
    v.container = el
    v.monitor = addEl(el, 'div', picturable({ class: 'monitor'}) )
    v.inputcontainer = addEl(el, 'div', 'input-container')
    v.inputdiv = addEl(v.inputcontainer, 'div', 'input-div')
    v.cmdline = addEl(v.inputdiv, 'p')
    v.inputline = addEl(v.cmdline, 'p', accessible({ class: 'input' }))
    v.PS1 = addEl(v.inputline, 'span')
    v.input = addEl(v.inputline, 'input', { size: 80 })
    v.belt = addEl(v.cmdline, 'div', 'belt')
    v.buttons = addEl(v.belt, 'div', 'keys')
    v.suggestions = addEl(v.belt, 'div', accessible({ class: 'suggest', 'aria-relevant': 'additions removals' }))

    // buttons
    let k = v.buttons
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
  get selectionStart() { return this.input.selectionStart }
  set selectionStart(p) { this.input.selectionStart = p }
  
  // clear the terminal window
  clear () {
    this.monitor.innerHTML = ''
    setTimeout(() => window.scroll(0, 0), this.timeout.scroll)
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
      v.emit(['InputFocused'])
      return true
    }
    return false
  }
  /* live ui */
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
      v.printing = false
    } else if ((v.msgidx !== msgidx) || (v.charduration === 0) || opt.direct) {
      msg.innerHTML = txt
      v.emit(['ContentAdded', 'ContentChanged'])
      if (cb) { cb() }
      if (opt.cb) { opt.cb() }
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
            if (l === '\n') v.emit(['NewLine', 'ContentAdded'], msg)
          }
        }
        setTimeout(function () {
          v._showChars(msgidx, msg, txttab, cb, txt, curvoice, opt)
        }, timeout * v.charduration)
      } else {
        v.playSound('endoftext')
        if (cb) { cb() }
        if (opt.cb) { opt.cb() }
        v.printing = false
      }
    }
  }
  render_out (lines, opt) {
    this.echo(lines, opt)
  }
  render_err (lines, opt) {
    this.echo(lines, opt)
  }
  echo (mesg, opt) {
    let v = this
    if (def(mesg)) {
      if (mesg instanceof Array) {
        for (let m of mesg) {
          v.echo(m, opt)
        }
        return v
      }
      opt = opt || {}
      var cb
      v.printing = true
      // v.loop_waiting()
      v.current_msg = addEl(opt.el || v.monitor, 'pre', 'msg' + ' ' + (opt.cls || ''))
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
      } else {
        let txt = msg.toString()// in case we have an object
        txt = txt.replace(re.hashtag, '<i class="hashtag"> $1 </i>').replace(re.voice, '<voice>$1</voice>')
        let txttab = articulate(txt)
        txt = txt.replace(re.tab, '&nbsp;&nbsp;').replace(re.br, '<br/>').replace(re.nbsp, '&nbsp;')
        v.msgidx++
        v.blindPrint(txt)
        v._showChars(v.msgidx, v.current_msg, txttab, cb, txt, 'char', opt)
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
    let v = this
    let c = v.shell
    // v.histindex = 0
    // console.log(txt, hlcls)
    addBtn(v.suggestions, hlcls, txt.replace(re.hashtag, '<i class="hashtag"> $1 </i>'), txt, function (e) {
      v.input.value += txt
      if (c.isValidInput(v.input.value)) {
        v.shell.enter()
      } else {
        v.shell.makeSuggestions(-1, false)
      }
    })
  }
  hideSuggestions () {
    this.suggestions.innerHTML = ''
  }
  /* */
  keyEffect (k) {
    let v = this
    if (v.env && k in v.env.cwd.effects.key) {
      v.env.cwd.effects.key[k](v)
    } else if (k in v.effects.key) {
      v.effects.key[k](v)
    }
  }
  terminateLine (k) {
    this.msgidx++
    let prev = addEl(this.monitor, 'p', 'input')
    prev.appendChild(this.PS1.cloneNode(true))
    prev.appendChild(dom.Txt(this.input.value))
    if (!k) {
      this.keyEffect('Enter')
      this.playSound('enter')
    } else {
      addEl(prev, 'span').innerHTML= k.show
    }
    this.next_input_value = ''
    this.disableInput()
  }
  renewLine (promptHTML) {
    this.enableInput()
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

    v.focusInput = function() {
      pr.focus()
      v.emit(['InputFocused'])
    }
    pr.keydown = function (e) {
      let k = new Key(e)
      v.shell.keydown(k)
      if (v.disabled.input) { v.msgidx +=1; v.next_input_value += k.str  }
    }
    pr.keyup = function (e) {
      let k = new Key(e)
      let ks = Key.toStr(k)
      v.statkey[ks] = (v.statkey[ks] || 0) + 1
      v.shell.keyup(k)
    }
    v.shell.renewLine()
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
    v.emit(['ContentAdded', 'ContentChanged'])
  }
  /** Question prompt **/
  ask (question, cb, args) {
    let v = this
    v.line = ''
    let reenable = v.disableInput()
    let choicebox = addEl(v.monitor, 'div', args.cls || 'choicebox')
    let createAnswer = () => {
      v.answer_input = (args.multiline ?
        addEl(choicebox, 'textarea', { cols: 78 }) :
        addEl(choicebox, 'input', { size: 78 })
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
      v.emit(['AnswerGiven','ContentChanged'])
    }

    v.echo(question, { el: choicebox,
      cb: () => {
        setTimeout(createAnswer, args.wait || 0)
        if (args.timeout) {
          setTimeout(v.enterKey, (args.wait || 0) + args.timeout)
        }
      } })
  }
  playSound(){/*hook me*/}
  playMusic(){/*hook me*/}
}

VTerm.prototype.SAFE_BROKEN_TEXT = true
Object.assign(VTerm.prototype, addonMixin)
Object.assign(VTerm.prototype, eventEmitterMixin)
