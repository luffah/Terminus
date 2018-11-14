/* Terminal interface which solve completion problem */
function overide (e) {
  e.preventDefault()
  e.stopPropagation()
}
function VTerm (container_id, context) {
  let t = this
  /* non dom properties */
  t.context = context
  t.msgidx = 0
  t.histindex = 0
  t.stdin = ''
  t.stdout = ''
  t.stderr = ''
  t.returncode = 0
  t.soundbank = null
  t.musicbank = null
  t.imgs = {}
  t.statkey = {}
  t.history = []
  t.disabled = {}

  t.timeout = { scrl: 100, ask:600 }
  // t.charduration = 26.25
  t.charduration = 13.125
  t.charfactor = { char: {char: 1, voy: 3, tag: 10, ' ': 25, ' ': 2, '!': 10, '?': 10, ',': 5, '.': 8, '\t': 2, '\n': 10 } }
  t.charhtml = { ' ': '&nbsp;', '\n': '<br>', '\t': '&nbsp;&nbsp;' }

  t.enterKey = t.enter
  t.complete_opts = { case: 'i', normalize: no_accents, humanized: true }

  t.scrl_lock = false
  t.cmdoutput = true
  t.suggestion_selected = null

  /* dom properties (view) */
  t.container = dom.Id(container_id)
  t.monitor = addEl(t.container, 'div', 'monitor')

  // for accessibility
  t.ghost_monitor = prEl(document.body, 'div', {
    class: 'ghost-monitor',
    role: 'log',
    'aria-live': 'polite'
    //    'aria-relevant':'additions removals'
  })
  t.inputdiv = addEl(addEl(t.container, 'div', 'input-container'), 'div', 'input-div')
  t.cmdline = addEl(t.inputdiv, 'p', {
    class: 'input',
    role: 'log',
    'aria-live': 'polite'
  })
  t.input = addEl(t.cmdline, 'input', { size: 80 })
  let b = addEl(t.cmdline, 'div', 'belt')
  let k = addEl(b, 'div', 'keys')
  t.suggestions = addEl(b, 'div', {
    class: 'suggest',
    role: 'log',
    'aria-live': 'polite',
    'aria-relevant': 'additions removals'
  })

  // buttons
  t.btn_clear = addBtn(k, 'key', '✗', 'Ctrl-U', function (e) {
    t.set_line(''); t.show_suggestions(this.context.getCommands().map(addspace))
  })
  t.btn_tab = addBtn(k, 'key', '↹', 'Tab', function (e) { t.make_suggestions() })
  t.btn_enter = addBtn(k, 'key', '↵', 'Enter', function (e) { t.enterKey() })
  Waiter.call(this)
  t.behave()
  t.disable_input()
}
VTerm.prototype = union(Waiter.prototype, {
  SAFE_BROKEN_TEXT: true,
  /* Getter and setter */
  setContext: function (ctx) { this.context = ctx },
  getContext: function () { return this.context },
  muteCommandResult: function () { this.cmdoutput = false },
  unmuteCommandResult: function () { this.cmdoutput = true },
  get_line: function () { return this.input.value.replace(/\s+/, ' ') },
  set_line: function (val) { this.input.value = val },
  get_cursor_pos: function () { return this.input.selectionStart },
  set_cursor_pos: function (c) { this.input.selectionStart = c },
  /* UI part */
  clear: function () {
    this.monitor.innerHTML = ''
    setTimeout(() => window.scroll(0, 0), this.timeout.scroll)
  },
  // Scroll the window to the last element (bottom of page)
  // TODO: replace with a function which focus on 'active' element
  scrl: function (timeout, retry) {
    let t = this
    let m = t.monitor
    // let hm = m.parentNode.offsetTop + m.offsetTop + m.offsetHeight
    let poffset = window.pageYOffset + window.innerHeight
    // let hi = t.inputdiv.offsetHeight
    // let y =  hm + hi - poffset
    let deltay = t.inputdiv.offsetParent.offsetTop + t.inputdiv.offsetHeight - poffset
    if (deltay > 0) {
      if (t.scrl_lock || def(timeout)) {
        retry = d(retry, 2)
        timeout = d(timeout, t.timeout.scrl)
        retry--
        if (retry > 0) {
          setTimeout(() => t.scrl(0, retry), timeout)
        }
      } else {
        window.scrollBy(0, deltay)
      }
    }
  },
  /* Setups */
  disable_input: function () { // disable can act as a mutex, if a widget don't get true then it shouldn't enable input
    let t = this
    if (!t.disabled.input) {
      t.disabled.input = true
      t.btn_clear.setAttribute('disabled', '')
      t.btn_tab.setAttribute('disabled', '')
      t.inputdiv.removeChild(t.cmdline)
      return true
    }
    return false
  },
  enable_input: function () {
    let t = this
    if (t.disabled.input) {
      t.disabled.input = false
      t.inputdiv.insertBefore(t.cmdline, t.inputdiv.childNodes[0])
      t.btn_clear.removeAttribute('disabled')
      t.btn_tab.removeAttribute('disabled')
      t.enterKey = t.enter
      t.input.focus()
      return true
    }
    return false
  },
  /* live ui */
  _show_previous_prompt: function (txt) {
    addEl(this.monitor, 'p', 'input').innerText = txt
  },
  _show_chars: function (msgidx, msg, txttab, cb, txt, curvoice, opt) {
    let t = this
    if (t.kill && !opt.unbreakable) {
      t.playSound('brokentext')
      if (opt.brokencb) {
        opt.brokencb()
      }
      if (t.SAFE_BROKEN_TEXT || opt.safe) {
        if (cb) { cb() }
        if (opt.cb) { opt.cb() }
      }
      t.busy = false
      t.printing = false
    } else if ((t.msgidx != msgidx) || (t.charduration == 0) || opt.direct) {
      msg.innerHTML = txt
      t.scrl()
      if (cb) { cb() }
      if (opt.cb) { opt.cb() }
      t.busy = false
      t.printing = false
    } else {
      let l = txttab.shift()
      if (l) {
        let timeout = 0
        if (l instanceof Node) {
          if (l.nodeName == 'VOICE') {
            curvoice = l.innerText
          } else {
            timeout = get(t.charfactor[curvoice], 'tag') || t.charfactor.char.tag
            msg.innerHTML += l.outerHTML
          }
        } else {
          msg.innerHTML += (t.charhtml[l] ? t.charhtml[l] : l)
          if (l.length > 1){
            timeout = get(t.charfactor[curvoice], 'voy') || t.charfactor.char.voy
            t.playSound(curvoice)
          } else {
            let f = get(t.charfactor[curvoice], l) || t.charfactor.char[l]
            t.playSound(def(f) ? l : curvoice)
            timeout = d(f, t.charfactor.char.char)
            if (l == '\n') t.scrl()
          }

        }
        setTimeout(function () {
          t._show_chars(msgidx, msg, txttab, cb, txt, curvoice, opt)
        }, timeout * t.charduration)
      } else {
        t.playSound('endoftext')
        if (cb) { cb() }
        if (opt.cb) { opt.cb() }
        t.busy = false
        t.printing = false
      }
    }
  },
  show_msg: function (mesg, opt) {
    let t = this
    if (def(mesg)) {
      if (mesg instanceof Array) {
        for (m in mesg) {
          t.show_msg(mesg[m], opt)
        }
        return t
      }
      opt = opt || {}
      var cb
      t.busy = t.printing = true; t.loop_waiting()
      if (typeof mesg === 'string') {
        mesg = _stdout(mesg)
      } else if (typeof mesg === 'number') {
        mesg = _stdout(String(mesg))
      }
      // FIXME
      // work arounded -- std / err flux shall be separated...
      msg = ''
      t.stdout = ''
      t.stderr = ''
      if (mesg.hasOwnProperty('stderr')) {
        t.stderr = mesg.stderr
        msg += t.stderr + '\n'
      }
      if (mesg.hasOwnProperty('stdout')) {
        t.stdout = mesg.stdout
        msg += t.stdout
      }
      if (mesg.hasOwnProperty('cb')) {
        cb = mesg.cb
      }
      //
      t.current_msg = addEl(opt.el || t.monitor, 'p', 'msg' + ' ' + (opt.cls || ''))
      let txt = msg.toString()// in case we have an object
      if (msg.nodeType == 1) {
        t.current_msg.appendChild(msg)
        t.blindPrint(msg)
        if (cb) { cb() }
        if (opt.cb) { opt.cb() }
        t.busy = false
      } else {
        txt = txt.replace(/(#[^#]+#)/g, '<i class="hashtag"> $1 </i>').replace(/<voice (\w*)\/>/g, '<voice>$1</voice>')
        let txttab = articulate(txt)
        txt = txt.replace(/\t/g, '&nbsp;&nbsp;').replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')
        t.msgidx++
        t.blindPrint(txt)
        t._show_chars(t.msgidx, t.current_msg, txttab, cb, txt, 'char', opt)
      }
    }
    return t
  },
  blindPrint: function(txt){
    this.ghostel = addEl(this.ghost_monitor, 'p')
    this.ghostel.innerHTML = txt.replace(/<div class='inmsg'.*><\/div>/, '').replace(/(<br>)/g, '<&nbsp;><br>').replace(/[«»]/g, '"').replace(/(\.\.\.)/g, '<br>')
  },
  show_loading_element_in_msg: function (list, opt) {
    let t = this
    opt = opt || {}
    let innerEl
    if (opt.el) {
      innerEl = opt.el
    } else {
      innerEl = addEl(opt.container || t.monitor, 'div', 'inmsg')
    }
    let i = 0
    let idx = t.msgidx
    let loop = setInterval(function () {
      if (t.msgidx != idx) {
        clearInterval(loop)
        if (opt.finalvalue) {
          innerEl.innerHTML = opt.finalvalue
          t.ghostel.innerHTML += ' ' + opt.finalvalue + ' '
        }
        if (opt.cb) {
          opt.cb()
        }
      } else {
        innerEl.innerHTML = list[i++ % list.length]
      }
    }, d(opt.period, 100))
    if (opt.duration) {
      setTimeout(function () {
        if (idx == t.msgidx) {
          t.msgidx++
        }
      }, opt.duration)
    }
    return this
  },
  /* Suggestion part */
  make_suggestions: function (tabidx, autocomplete) {
    let ret = true
    let t = this
    tabidx = d(tabidx, -1)
    autocomplete = d(autocomplete, true)
    t.suggestions.innerHTML = ''
    let l = t.get_line(); var pos = t.input.selectionStart
    let hlidxs = []
    args = l.split(' ')
    t.suggestion_selected = null
    if (args.length > 0) {
      let offset = 0; let idx
      for (idx = 0; idx < args.length; idx++) {
        offset += args[idx].length + 1
        if (offset > pos) break
      }
      let tocomplete = args[idx]
      let match = []
      // which word to guess
      let trymatch = (potential, tocomplete) => {
        let tocompleterx = new RegExp('^' + t.complete_opts.normalize(tocomplete), t.complete_opts.case)
        return t.complete_opts.normalize(potential).match(tocompleterx)
      }
      if (tocomplete && idx > 0) { // at least 1 arg
        match = _completeArgs(args, idx, tocomplete, t.context, trymatch)
      } else if (args[0].length > 0) {
        if (t.context.hasRightForCommand(args[0])) { // propose argument
          match = _completeArgs(args, idx, tocomplete, t.context, trymatch)
        } else { // propose command completion
          t.context.getCommands().forEach((c) => { if (trymatch(c, tocomplete)) { match.push(c) } })
        }
      } else { // propose commands
        tocomplete = ''
        match = t.context.getCommands().map(addspace)
      }
      // console.log(match)
      // find solutions
      if (match.length === 0) {
        t.set_line(l + '?')
        setTimeout(function () { t.set_line(l + '??') }, 100)
        setTimeout(function () { t.set_line(l) }, 200)
      } else if (match.length == 1) {
        if (autocomplete) {
          let lb = tocomplete.split('/')
          lb[lb.length - 1] = match[0]
          args.splice(idx, 1, lb.join('/')) // insert value at idx
          t.set_line(args.join(' ').replace('././', './'))// regex workaround
        } else {
          if (match[0] == tocomplete) {
            t.set_line(l + ' ')
          }
          t.show_suggestions(match)
        }
      } else {
        let lcp = commonprefix(match)
        if (match.indexOf(lcp) > -1) {
          t.set_line(l + ' ')
        } else if (tabidx > -1) {
          if (tabidx < match.length) {
            //          t.set_line(match[idx]+' ');
            hlidxs[tabidx] = 'select'
            t.suggestion_selected = match[tabidx]
          } else {
            ret = false
          }
        }
        if (lcp.length > 0 && autocomplete) {
          let lb = tocomplete.split('/')
          lb[lb.length - 1] = lcp
          args.splice(idx, 1, lb.join('/'))
          t.set_line(args.join(' '))
        }
        t.show_suggestions(match, hlidxs)
      }
    }
    return ret
  },
  show_suggestions: function (list, highlights) {
    highlights = highlights || []
    this.suggestions.innerHTML = '<div class="visually-hidden">' + _('Suggestions') + '</div>'
    for (let i = 0; i < list.length; i++) {
      this.show_suggestion(list[i], highlights[i])
    }
  },
  show_suggestion: function (txt, hlcls) {
    let t = this
    t.histindex = 0
    // console.log(txt, hlcls)
    addBtn(t.suggestions, hlcls, txt.replace(/(#[^#]+#)/g, '<i class="hashtag"> $1 </i>'), txt, function (e) {
      t.input.value += txt
      if (t.argsValid(t.input.value.replace(/\s+$/, '').split(' '))) {
        t.enter()
      } else {
        t.make_suggestions(-1, false)
      }
    })
    t.scrl()
  },
  hide_suggestions: function () {
    this.suggestions.innerHTML = ''
  },
  /* */
  argsValid: function (args) {
    return _validArgs(args.shift(), args, this.context)
  },
  enter_effect: function () {
    if (this.context && this.context.room.enter_effect) {
      this.context.room.enter_effect(this)
    } else if (typeof enter_effect === 'function') {
      enter_effect()
    }
  },
  enter: function () {
    // Enter -> parse and execute command
    let t = this
    t.playSound('enter')
    t.enter_effect()
    let l = t.get_line().replace(/\s+$/, '')
    if (l.length > 0) {
      let m = t.monitor
      t.monitor = addEl(m, 'div', 'screen')

      t.histindex = 0
      t._show_previous_prompt(t.input.value)
      t.history.push(t.input.value)

      let echo = _parse_exec(t, l)
      console.log(echo)
      if (echo) {
        if (t.cmdoutput) {
          let supercb = []
          for (let i = 0; i < echo.length(); i++) {
            supercb.push(() => {
              let idx = echo.getIdx()
              let n = echo.next()
              t.show_img(n.pics, { index: idx })
              t.show_msg(n, { cb: supercb.shift() })
            })
          }
          supercb.shift()()
        }
        t.set_line('')
        t.hide_suggestions()
      }

      t.monitor = m
    }
  },
  /*****************/
  /** Prompt behavior part **/
  /*****************/
  behave: function () {
    this.global_behavior()
    this.input_behavior()
  },
  global_behavior: function () {
    window.onbeforeunload = function (e) {
      return 'Quit the game ?'
    }
  },
  input_behavior: function () {
    // behavior
    var t = this
    var pr = t.input
    var lastkey = [null, 0]

    dom.body.onkeydown = function (e) {
      vt.busy = true
      e = e || window.event// Get event
      if (def(t.overapp)) {
        t.overapp.onkeydown(e)
      } else if (t.choose_input || t.password_input) {
        e.preventDefault()
      } else if (t.answer_input) {
      } else {
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].indexOf(e.key) != -1) {
          if (e.shiftKey) {
            e.preventDefault()
          }
        } else {
          let focused = dom.activeElement
          if (!focused || focused != pr) {
            pr.focus(); t.scrl()
          }
          pr.onkeydown(e)
        }
      }
    }
    dom.body.onkeyup = function (e) {
      e = e || window.event// Get event
      if (def(t.overapp)) {
        t.overapp.onkeyup(e)
      } else if (def(t.choose_input)) {
        t._choose_key(e)
      } else if (def(t.password_input)) {
        t._password_key(e)
      } else if (def(t.answer_input)) {
        t._answer_key(e)
      } else {
        if (['PageUp', 'PageDown', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].indexOf(e.key) != -1) {
          if (e.shiftKey) {
            e.preventDefault()
          }
        } else {
          let focused = dom.activeElement
          if (!focused || focused != pr) {
            pr.focus(); t.scrl()
          }
          pr.onkeyup(e)
        }
      }
      vt.busy = false
    }
    pr.onkeydown = function (e) {
      let k = e.key
      if (['Tab', 'Enter', 'ArrowUp', 'ArrowDown'].indexOf(k) != -1) {
        overide(e)
      } else if (e.ctrlKey) {
        if (['c', 'v', 'x', 'y', 'z'].indexOf(k) != -1) {
          overide(e)
        }
      } else if (k === 'PageUp' || k === 'PageDown') {
        window.focus()
        pr.blur()
      }
      return !e.defaultPrevented
    }
    pr.onkeyup = function (e) {
      let k = e.key
      vt.statkey[k] = (vt.statkey[k] || 0) + 1
      if (lastkey[0] == k) { lastkey[1]++ } else { lastkey[1] = 0 }
      lastkey[0] = k
      t.hide_suggestions()
      if (k === 'Enter') {
        overide(e)
        if (t.suggestion_selected) {
          t.input.value += t.suggestion_selected
          t.suggestion_selected = 0
          t.make_suggestions()
          lastkey[0] = 'Tab'
        } else {
          t.enter()
        }
        t.scrl()
      } else if (k === 'Tab' && !(e.ctrlKey || e.altKey)) {
        overide(e)
        if (!t.make_suggestions(lastkey[1] - 1)) lastkey[1] = 0
        t.scrl()
      } else if (e.ctrlKey) {
        if (k === 'c') { // CTRL+C - clear
          overide(e)
          if (t.busy) {
            t.current_msg.innerHTML += '<br>^C'
          } else {
            t._show_previous_prompt(t.get_line() + '^C')
          }
          t.msgidx++
          t.set_line('')
        } else if (k === 'u') { // CTRL+U - clear line
          overide(e)
          t.set_line('')
          //        } else if (  k === 'v' || k === 'x' || k === 'y' || k === 'z'  ) {
        } else if (k === 'v' || k === 'x') {
          // replace CTRL + W - remove last component
          overide(e)
          let line = t.get_line()
          line = line.replace(/\/$/, '')
          let lineparts = line.split(' ')
          let lastarg = lineparts.pop().split('/')
          lastarg.pop()
          if (lastarg.length > 1) {
            lastarg.push('')
          }
          lineparts.push(lastarg.join('/'))
          t.set_line(lineparts.join(' '))
        }
      } else if (k === 'PageUp' || k === 'PageDown') {
        window.focus()
        pr.blur()
      } else if (k === 'ArrowDown') { // down
        if (t.histindex > 0) {
          t.histindex--
          t.set_line(t.history[t.history.length - 1 - t.histindex])
        }
      } else if (k === 'ArrowUp') { // up
        if (t.histindex < t.history.length) {
          let prev = t.history[t.history.length - 1 - t.histindex]
          if (t.histindex === 0) {
            let txt = t.get_line()
            if (txt.length > 0 && txt !== prev) {
              t.history.push(txt)
            }
          }
          t.set_line(prev)
          t.histindex++
        }
      }
      return !e.defaultPrevented
    }
  },
  /** extra programs **/
  exec: function (fu, cb) {
    let t = this
    t.set_line('')
    let m = t.monitor
    //    var m = document.body;
    let cont = addEl(m, 'div', 'app-container')
    t.overapp = addEl(cont, 'div', 'app')
    t.disable_input()
    let endapp = () => {
      t.overapp.setAttribute('disabled', true)
      m.removeChild(cont)
      t.overapp = undefined
      if (cb) cb()
    }
    /// 
    t.enterKey = function () { console.log('Enter Pressed but Battle Mode') }
    return fu(vt, t.overapp, endapp)
  },
  /** Choice prompt **/
  /** TODO : add live action function option **/
  ask_choose: function (question, choices, callback, opts) {
    let t = this
    let choices_btn = []
    let curidx = 0
    opts = d(opts, {})
    disabled_choices = d(opts.disabled_choices, [])
    direct = d(opts.direct, false)
    while (disabled_choices.indexOf(curidx) > -1) {
      curidx++
    }
    let choicebox = addEl(t.monitor, 'div', 'choicebox')
    t.show_msg(question, { direct: direct, el: choicebox })

    t.set_line('')
    t.choose_input = addEl(choicebox, 'fieldset', 'choices')
    let reenable = t.disable_input()

    let click = function (e) {
      let i = e.target.getAttribute('idx')
      addAttrs(choices_btn[curidx], { checked: '' })
      addAttrs(choices_btn[i], { checked: 'checked' })
      curidx = i
      return t.enterKey()
    }
    let onkeydown = function (e) {
      t._choose_key(e)
    }
    t.enterKey = function (e) {
      t.playSound('choiceselect')
      t.choose_input.value = choices[curidx]
      t.show_msg(choices[curidx], { direct:direct, el: choicebox, unbreakable: true })
      choicebox.removeChild(t.choose_input)
      t.choose_input = undefined
      if (reenable) { t.enable_input() }
      setTimeout(()=> t.show_msg(callback(t, curidx), {direct:direct}), t.timeout.ask)
    }
    t._choose_key = function (e) {
      let k = e.key
      if (k == 'ArrowDown' || k == 'ArrowUp' || k == 'Tab') {
        t.playSound('choicemove')
        choices_btn[curidx].removeAttribute('checked')
        if (k == 'ArrowDown' || (!e.shiftKey && k == 'Tab')) {
          curidx = ((++curidx) % choices_btn.length)
          while (disabled_choices.indexOf(curidx) > -1) {
            curidx = ((++curidx) % choices_btn.length)
          }
        } else if (k == 'ArrowUp' || (e.shiftKey && k == 'Tab')) {
          curidx = (--curidx >= 0 ? curidx : (choices_btn.length - 1))
          while (disabled_choices.indexOf(curidx) > -1) {
            curidx = (--curidx >= 0 ? curidx : (choices_btn.length - 1))
          }
        }
        addAttrs(choices_btn[curidx], { checked: 'checked' })
        choices_btn[curidx].focus()
        t.ghostel.innerHTML = choices[curidx]
      } else if (k == 'Enter') {
        t.enterKey()
      }
      e.preventDefault()
    }

    for (let i = 0; i < choices.length; i++) {
      if (disabled_choices.indexOf(i) == -1) {
        cho = addEl(t.choose_input, 'div', 'choice')
        choices[i] = choices[i]
        choices_btn.push(
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
        }).innerHTML = choices[i].replace(/(#[^#]+#)/g, '<i class="hashtag"> $1 </i>')
      } else {
        choices_btn.push(null)
      }
    }
    t.choose_input.onkeydown = onkeydown
    addAttrs(t.choose_input, { value: choices[curidx] })
    addAttrs(choices_btn[curidx], { checked: 'checked' })
    //    choices_btn[0].focus();
    t.scrl()
  },
  /** Question prompt **/
  ask: function (question, cb, args) {
    let t = this
    t.set_line('')
    let reenable = t.disable_input()
    let choicebox = addEl(t.monitor, 'div', args.cls || 'choicebox')
    let create_answer = () => {
      t.answer_input = (args.multiline
        ? addEl(choicebox, 'textarea', { cols: 78 })
        : addEl(choicebox, 'input', { size: 78 })
      )
      addBtn(addEl(choicebox, 'div', 'keys'), 'key', '↵', 'Enter', function (e) { t.enterKey() })
      t.answer_input.value = args.value || ''
      t.answer_input.placeholder = args.placeholder || ''
      t.answer_input.readOnly = args.readOnly || false
      t.answer_input.focus()
      t.scrl()
      t.answer_input.onkeyup = t._answer_key
      if (args.anykeydown) {
        t.answer_input.ondown = (e) => {
          if (e.ctrlKey && args.ctrlkeydown && args.ctrlkeydown.hasOwnProperty(e.key)) {
            args.ctrlkeydown[e.key](t, e)
          } else if (args.keydown && args.keydown.hasOwnProperty(e.key)) {
            args.keydown[e.key](t, e)
          } else if (args.anykeydown) {
            args.anykeydown(t, e)
          }
        }
      }
    }
    let end_answer = () => {
      if (args.disappear) args.disappear()
      if (reenable) t.enable_input()
    }
    let lock_answer = () => {
      t.answer_input.setAttribute('disabled', true)
      t.answer_input = undefined
      if (args.disappear) choicebox.outerHTML = ''
    }
    t._answer_key = args.ev || ((e) => {
      if (e.ctrlKey && args.ctrlkeyup && args.ctrlkeyup.hasOwnProperty(e.key)) {
        args.ctrlkeyup[e.key](t, e)
      } else if (args.keyup && args.keyup.hasOwnProperty(e.key)) {
        args.keyup[e.key](t, e)
      } else if (e.key === 'Enter') {
        t.enterKey()
        e.preventDefault()
        t.scrl()
      } else if (args.anykeyup) {
        args.anykeyup(t, e)
      }
    })
    t.enterKey = () => {
      t.playSound('choiceselect')
      let ret = t.answer_input.value
      lock_answer()
      setTimeout(()=> {
        ret = cb ? cb(ret) : ret
        end_answer()
        t.show_msg(ret)
      }, t.timeout.ask)
    }

    t.show_msg(question, { el: choicebox,
      cb: () => {
        setTimeout(create_answer, args.wait || 0)
        if (args.timeout) {
          setTimeout(t.enterKey, (args.wait || 0) + args.timeout)
        }
      } })
  },
  /** Password prompt **/
  /** TODO : maybe, add live action function option **/
  ask_password: function (cmdpass, callback) {
    this._begin_password()
    this._ask_password_rec(cmdpass, callback)
  },
  _begin_password: function () {
    let t = this
    t.set_line('')
    t._cur_box = addEl(t.monitor, 'div', 'choicebox')
    t._div = addEl(t.inputdiv, 'div', { class: 'passinput' })
    t.password_input = addEl(t._div, 'input', { size: 20 })

    t.password_input.focus()
    t.password_input.onkeyup = function (e) {
      let k = e.key
      if (k === 'Enter') { // ENTER
        t.enterKey()
        e.preventDefault()
        t.scrl()
      }
    }
    t.disable_input()
  },
  _end_password: function () {
    let t = this
    t.inputdiv.removeChild(t._div)
    t.password_input = undefined
    t._div = undefined
    t.enable_input()
  },
  _password_key: function (e) {
  // nothing
  },
  _ask_password_rec: function (cmdpass, callback) {
    let t = this
    if (cmdpass.length > 0) {
      let p = cmdpass.shift()
      let question = d(p.question, _('ask_password'))
      t.show_msg(question, { el: t._cur_box })
      t.enterKey = function () {
        t.playSound('choiceselect')
        let ret = t.password_input.value
        t.password_input.value = ''
        if (p.password === ret) {
          if (p.passok) {
            t.show_msg(p.passok, { el: t._cur_box })
          }
          t._ask_password_rec(cmdpass, callback)
        } else {
          if (p.passko) {
            t.show_msg(p.passko, { el: t._cur_box })
          }
          t.show_msg(callback(false, cmdpass), { el: t._cur_box })
          t._end_password()
        }
      }
      t.scrl()
    } else {
      t.show_msg(callback(true, cmdpass))
      t._end_password()
    }
  },
  // --------//
  // SOUND  //
  muteSound: function () {
    this.mute = true
  },
  unmuteSound: function () {
    this.mute = false
  },
  playSound: function (key) {
    if (!this.mute && this.soundbank) {
      this.soundbank.play(key)
    }
  },
  playMusic: function (key, p) {
    if (!this.mute && this.musicbank) {
      this.musicbank.play(key, p)
    }
  },

  // --------//
  // IMAGES //
  push_img: function (img, opt) {
    if (img) {
      opt = opt || {}
      let idx = d(opt.index, -1)
      if (!this.imgs[idx]) { this.imgs[idx] = [] }
      this.imgs[d(opt.index, -1)].push(img)
    }
    return this
  },
  show_img: function (opt) {
    opt = opt || {}
    let t = this
    let idx = d(opt.index, -1)
    let im
    let imgs = t.imgs[idx]
    if (imgs && imgs.length > 0) {
      let c = addEl(t.monitor, 'div', 'img-container')
      while (im = imgs.shift()) {
        im.render(c, () => {
          t.scrl(1000)
        }
        )
      }
    }
  },
  rmCurrentImg: function (timeout) {
    let t = this
    setTimeout(function () {
      let y = t.current_msg.getElementsByClassName('img-container')
      let i
      for (i = 0; i < y.length; i++) {
        msg.removeChild(y[i])
      }
    }, timeout)
  }
})
