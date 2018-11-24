/* Terminal interface which solve completion problem */
function overide (e) {
  e.preventDefault()
  e.stopPropagation()
}
function VTerm (container_id, ctx) {
  let v = this
  /* non dom properties */
  v.ctx = ctx
  v.msgidx = 0
  v.histindex = 0
  v.stdin = ''
  v.stdout = ''
  v.stderr = ''
  v.returncode = 0
  v.soundbank = null
  v.musicbank = null
  v.imgs = {}
  v.statkey = {}
  v.history = []
  v.disabled = {}
  v.timeout = { scrl: 100, ask: 600 }
  // v.charduration = 26.25
  v.charduration = 13.125
  v.charfactor = { char: { char: 1, voy: 3, tag: 10, ' ': 25, ' ': 2, '!': 10, '?': 10, ',': 5, '.': 8, '\t': 2, '\n': 10 } }
  v.charhtml = { ' ': '&nbsp;', '\n': '<br>', '\t': '&nbsp;&nbsp;' }
  v.enterKey = v.enter
  v.complete_opts = { case: 'i', normalize: no_accents, humanized: true }

  v.scrl_lock = false
  v.cmdoutput = true
  v.suggestion_selected = null

  /* dom properties (view) */
  v.container = dom.Id(container_id)
  v.monitor = addEl(v.container, 'div', 'monitor')

  // for accessibility
  v.ghost_monitor = prEl(dom.body, 'div', {
    class: 'ghost-monitor',
    role: 'log',
    'aria-live': 'polite'
    //    'aria-relevant':'additions removals'
  })
  v.inputdiv = addEl(addEl(v.container, 'div', 'input-container'), 'div', 'input-div')
  v.cmdline = addEl(v.inputdiv, 'p', {
    class: 'input',
    role: 'log',
    'aria-live': 'polite'
  })
  v.input = addEl(v.cmdline, 'input', { size: 80 })
  let b = addEl(v.cmdline, 'div', 'belt')
  let k = addEl(b, 'div', 'keys')
  v.suggestions = addEl(b, 'div', {
    class: 'suggest',
    role: 'log',
    'aria-live': 'polite',
    'aria-relevant': 'additions removals'
  })

  // buttons
  v.btn_clear = addBtn(k, 'key', '✗', 'Ctrl-U', (e) => {
    v.line = ''; v.show_suggestions(v.ctx.getCommands().map(addspace))
  })
  v.btn_tab = addBtn(k, 'key', '↹', 'Tab', (e) => { v.make_suggestions() })
  v.btn_enter = addBtn(k, 'key', '↵', 'Enter', (e) => { v.enterKey() })
  Waiter.call(v)
  v.behave()
  v.disable_input()
}
/*  HINTS
 *  to disable stdout  : vt.cmdoutput = false
 *  to set cursor position : vt.input.selectionStart = pos
 *  to modify line : vt.line = str
 *  to clear : vt.clear()
 *  to mute sound : vt.mute = true
 */

VTerm.prototype = {
  SAFE_BROKEN_TEXT: true,
  /* Getter and setter */
  get line () { return this.input.value.replace(/\s+/, ' ') },
  set line (s) { this.input.value = s },
  /* UI part */
  clear: function () {
    this.monitor.innerHTML = ''
    setTimeout(() => window.scroll(0, 0), this.timeout.scroll)
  },
  // Scroll the window to the last element (bottom of page)
  // TODO: replace with a function which focus on 'active' element
  scrl: function (timeout, retry) {
    let v = this
    let m = v.monitor
    // let hm = m.parentNode.offsetTop + m.offsetTop + m.offsetHeight
    let poffset = window.pageYOffset + window.innerHeight
    // let hi = v.inputdiv.offsetHeight
    // let y =  hm + hi - poffset
    let deltay = v.inputdiv.offsetParent.offsetTop + v.inputdiv.offsetHeight - poffset
    if (deltay > 0) {
      if (v.scrl_lock || def(timeout)) {
        retry = d(retry, 2)
        timeout = d(timeout, v.timeout.scrl)
        retry--
        if (retry > 0) {
          setTimeout(() => v.scrl(0, retry), timeout)
        }
      } else {
        window.scrollBy(0, deltay)
      }
    }
  },
  /* Setups */
  disable_input: function () { // disable can act as a mutex, if a widget don't get true then it shouldn't enable input
    let v = this
    if (!v.disabled.input) {
      v.disabled.input = true
      v.btn_clear.setAttribute('disabled', '')
      v.btn_tab.setAttribute('disabled', '')
      v.inputdiv.removeChild(v.cmdline)
      return true
    }
    return false
  },
  enable_input: function () {
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
  },
  /* live ui */
  _show_previous_prompt: function (txt) {
    addEl(this.monitor, 'p', 'input').innerText = txt
  },
  _show_chars: function (msgidx, msg, txttab, cb, txt, curvoice, opt) {
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
    } else if ((v.msgidx != msgidx) || (v.charduration == 0) || opt.direct) {
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
          if (l.nodeName == 'VOICE') {
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
            timeout = d(f, v.charfactor.char.char)
            if (l == '\n') v.scrl()
          }
        }
        setTimeout(function () {
          v._show_chars(msgidx, msg, txttab, cb, txt, curvoice, opt)
        }, timeout * v.charduration)
      } else {
        v.playSound('endoftext')
        if (cb) { cb() }
        if (opt.cb) { opt.cb() }
        v.busy = false
        v.printing = false
      }
    }
  },
  show_msg: function (mesg, opt) {
    let v = this
    if (def(mesg)) {
      if (mesg instanceof Array) {
        for (m in mesg) {
          v.show_msg(mesg[m], opt)
        }
        return v
      }
      opt = opt || {}
      var cb
      v.busy = v.printing = true
      v.loop_waiting()
      if (typeof mesg === 'string') {
        mesg = _stdout(mesg)
      } else if (typeof mesg === 'number') {
        mesg = _stdout(String(mesg))
      }
      // FIXME
      // work arounded -- std / err flux shall be separated...
      msg = ''
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
      v.current_msg = addEl(opt.el || v.monitor, 'p', 'msg' + ' ' + (opt.cls || ''))
      let txt = msg.toString()// in case we have an object
      if (msg.nodeType == 1) {
        v.current_msg.appendChild(msg)
        v.blindPrint(msg)
        if (cb) { cb() }
        if (opt.cb) { opt.cb() }
        v.busy = false
      } else {
        txt = txt.replace(/(#[^#]+#)/g, '<i class="hashtag"> $1 </i>').replace(/<voice (\w*)\/>/g, '<voice>$1</voice>')
        let txttab = articulate(txt)
        txt = txt.replace(/\t/g, '&nbsp;&nbsp;').replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')
        v.msgidx++
        v.blindPrint(txt)
        v._show_chars(v.msgidx, v.current_msg, txttab, cb, txt, 'char', opt)
      }
    }
    return v
  },
  blindPrint: function (txt) {
    this.ghostel = addEl(this.ghost_monitor, 'p')
    this.ghostel =txt.replace( /(<br>)/g, '<&nbsp;><br>'
      ).replace( /(<\w+[^>]*><\/\w+>|<\w+[^>]*\/>)/g, ''
      ).replace( /[«»]/g, '"'
      ).replace( /(\.\.\.)/g, '<br>')
  },
  show_loading_element_in_msg: function (list, opt) {
    let v = this
    opt = opt || {}
    let innerEl = opt.el || addEl(opt.container || v.monitor, 'div', 'inmsg')
    let i = 0
    let idx = v.msgidx
    let end =  () => {
        clearInterval(loop)
        if (opt.finalvalue) {
          innerEl.innerHTML = opt.finalvalue
          v.blindPrint(opt.finalvalue)
        }
        if (opt.cb) {
          opt.cb()
        }
    }
    let loop = setInterval(() => {
      if (v.msgidx != idx) end()
      else  innerEl.innerHTML = list[i++ % list.length]
    }, d(opt.period, 100))
    if (opt.duration) {
      setTimeout(()  => {
        if (idx == v.msgidx) {
          end()
          v.msgidx++
        }
      }, opt.duration)
    }
    return this
  },
  /* Suggestion part */
  make_suggestions: function (tabidx, autocomplete) {
    let ret = true
    let v = this
    tabidx = d(tabidx, -1)
    autocomplete = d(autocomplete, true)
    v.suggestions.innerHTML = ''
    let l = v.line; var pos = v.input.selectionStart
    let hlidxs = []
    args = l.split(' ')
    v.suggestion_selected = null
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
        let tocompleterx = new RegExp('^' + v.complete_opts.normalize(tocomplete), v.complete_opts.case)
        return v.complete_opts.normalize(potential).match(tocompleterx)
      }
      if (tocomplete && idx > 0) { // at least 1 arg
        match = _completeArgs(args, idx, tocomplete, v.ctx, trymatch)
      } else if (args[0].length > 0) {
        if (v.ctx.hasRightForCommand(args[0])) { // propose argument
          match = _completeArgs(args, idx, tocomplete, v.ctx, trymatch)
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
      } else if (match.length == 1) {
        if (autocomplete) {
          let lb = tocomplete.split('/')
          lb[lb.length - 1] = match[0]
          args.splice(idx, 1, lb.join('/')) // insert value at idx
          v.line = args.join(' ').replace('././', './')// regex workaround
        } else {
          if (match[0] == tocomplete) {
            v.line = l + ' '
          }
          v.show_suggestions(match)
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
        v.show_suggestions(match, hlidxs)
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
    let v = this
    v.histindex = 0
    // console.log(txt, hlcls)
    addBtn(v.suggestions, hlcls, txt.replace(/(#[^#]+#)/g, '<i class="hashtag"> $1 </i>'), txt, function (e) {
      v.input.value += txt
      if (v.argsValid(v.input.value.replace(/\s+$/, '').split(' '))) {
        v.enter()
      } else {
        v.make_suggestions(-1, false)
      }
    })
    v.scrl()
  },
  hide_suggestions: function () {
    this.suggestions.innerHTML = ''
  },
  /* */
  argsValid: function (args) {
    return _validArgs(args.shift(), args, this.ctx)
  },
  enter_effect: function () {
    if (this.ctx && this.ctx.h.r.enter_effect) {
      this.ctx.h.r.enter_effect(this)
    } else if (typeof enter_effect === 'function') {
      enter_effect()
    }
  },
  enter: function () {
    // Enter -> parse and execute command
    let v = this
    v.playSound('enter')
    v.enter_effect()
    let l = v.line.replace(/\s+$/, '')
    if (l.length > 0) {
      let m = v.monitor
      v.monitor = addEl(m, 'div', 'screen')

      v.histindex = 0
      v._show_previous_prompt(v.input.value)
      v.history.push(v.input.value)

      let echo = _parse_exec(v, l)
      // console.log(echo)
      if (echo) {
        if (v.cmdoutput) {
          let supercb = []
          for (let i = 0; i < echo.length(); i++) {
            supercb.push(() => {
              let idx = echo.getIdx()
              let n = echo.next()
              if (n.pic) {
                v.push_img(n.pic, {index: idx })
              }
              v.show_img({index: idx })
              v.show_msg(n, { cb: supercb.shift() })
            })
          }
          supercb.shift()()
        }
        v.line = ''
        v.hide_suggestions()
      }

      v.monitor = m
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
    var v = this
    var pr = v.input
    var lastkey = [null, 0]

    dom.body.onkeydown = function (e) {
      v.busy = true
      e = e || window.event// Get event
      if (def(v.overapp)) {
        v.overapp.onkeydown(e)
      } else if (v.choose_input || v.password_input) {
        e.preventDefault()
      } else if (v.answer_input) {
      } else {
        if (e.code.match('Arrow') && e.shiftKey) {
            e.preventDefault()
        } else {
          let focused = dom.activeElement
          if (!focused || focused != pr) {
            pr.focus(); v.scrl()
          }
          pr.onkeydown(e)
        }
      }
    }
    dom.body.onkeyup = function (e) {
      e = e || window.event// Get event
      // console.log(e)
      if (def(v.overapp)) {
        v.overapp.onkeyup(e)
      } else if (def(v.choose_input)) {
        v._choose_key(e)
      } else if (def(v.password_input)) {
        v._password_key(e)
      } else if (def(v.answer_input)) {
        v._answer_key(e)
      } else {
        if (e.code.match(/^(Arrow|Page)/) && e.shiftKey) {
            e.preventDefault()
        } else {
          let focused = dom.activeElement
          if (!focused || focused != pr) {
            pr.focus(); v.scrl()
          }
          pr.onkeyup(e)
        }
      }
      v.busy = false
    }
    pr.onkeydown = function (e) {
      if (e.code.match(/Tab|Enter|ArrowUp|ArrowDown/)) {
        overide(e)
      } else if (e.ctrlKey) {
        if ((e.key || String.fromCharCode(e.keyCode)).match(/^[CVXYZ]$/)){
          overide(e)
        }
      } else if (e.code.match(/Page/)) {
        window.focus()
        pr.blur()
      }
      return !e.defaultPrevented
    }
    pr.onkeyup = function (e) {
      let k = e.code
      v.statkey[k] = (v.statkey[k] || 0) + 1
      if (lastkey[0] == k) { lastkey[1]++ } else { lastkey[1] = 0 }
      lastkey[0] = k
      v.hide_suggestions()
      if (k === 'Enter') {
        overide(e)
        if (v.suggestion_selected) {
          v.input.value += v.suggestion_selected
          v.suggestion_selected = 0
          v.make_suggestions()
          lastkey[0] = 'Tab'
        } else {
          v.enter()
        }
        v.scrl()
      } else if (k === 'Tab' && !(e.ctrlKey || e.altKey)) {
        overide(e)
        if (!v.make_suggestions(lastkey[1] - 1)) lastkey[1] = 0
        v.scrl()
      } else if (e.ctrlKey) {
        k = e.key || String.fromCharCode(e.keyCode)
        if (k === 'C') { // CTRL+C - clear
          overide(e)
          if (v.busy) {
            v.current_msg.innerHTML += '<br>^C'
          } else {
            v._show_previous_prompt(v.line + '^C')
          }
          v.msgidx++
          v.line = ''
        } else if (k === 'U') { // CTRL+U - clear line
          overide(e)
          v.line = ''
          //        } else if (  k === 'v' || k === 'x' || k === 'y' || k === 'z'  ) {
        } else if (k === 'V' || k === 'X') {
          // replace CTRL + W - remove last component
          overide(e)
          lev.line = v.line
          line = line.replace(/\/$/, '')
          lev.lineparts = line.split(' ')
          let lastarg = lineparts.pop().split('/')
          lastarg.pop()
          if (lastarg.length > 1) {
            lastarg.push('')
          }
          lineparts.push(lastarg.join('/'))
          v.line = lineparts.join(' ')
        }
      } else if (k === 'PageUp' || k === 'PageDown') {
        window.focus()
        pr.blur()
      } else if (k === 'ArrowDown') { // down
        if (v.histindex > 0) {
          v.histindex--
          v.line = v.history[v.history.length - 1 - v.histindex]
        }
      } else if (k === 'ArrowUp') { // up
        if (v.histindex < v.history.length) {
          let prev = v.history[v.history.length - 1 - v.histindex]
          if (v.histindex === 0) {
            let txt = v.line
            if (txt.length > 0 && txt !== prev) {
              v.history.push(txt)
            }
          }
          v.line = prev
          v.histindex++
        }
      }
      return !e.defaultPrevented
    }
  },
  /** extra programs **/
  exec: function (fu, cb) {
    let v = this
    v.line = ''
    let m = v.monitor
    //    var m = document.body;
    let cont = addEl(m, 'div', 'app-container')
    v.overapp = addEl(cont, 'div', 'app')
    v.disable_input()
    let endapp = () => {
      v.overapp.setAttribute('disabled', true)
      m.removeChild(cont)
      v.overapp = undefined
      if (cb) cb()
    }
    /// 
    v.enterKey = function () { console.log('Enter Pressed but Battle Mode') }
    return fu(v, v.overapp, endapp)
  },
  /** Choice prompt **/
  /** TODO : add live action function option **/
  ask_choose: function (question, choices, callback, opts) {
    let v = this
    let choices_btn = []
    let curidx = 0
    opts = d(opts, {})
    disabled_choices = d(opts.disabled_choices, [])
    direct = d(opts.direct, false)
    while (disabled_choices.indexOf(curidx) > -1) {
      curidx++
    }
    let choicebox = addEl(v.monitor, 'div', 'choicebox')
    v.show_msg(question, { direct: direct, el: choicebox })

    v.line = ''
    v.choose_input = addEl(choicebox, 'fieldset', 'choices')
    let reenable = v.disable_input()

    let click = function (e) {
      let i = e.target.getAttribute('idx')
      addAttrs(choices_btn[curidx], { checked: '' })
      addAttrs(choices_btn[i], { checked: 'checked' })
      curidx = i
      return v.enterKey()
    }
    let onkeydown = function (e) {
      v._choose_key(e)
    }
    v.enterKey = function (e) {
      v.playSound('choiceselect')
      v.choose_input.value = choices[curidx]
      v.show_msg(choices[curidx], { direct: direct, el: choicebox, unbreakable: true })
      choicebox.removeChild(v.choose_input)
      v.choose_input = undefined
      if (reenable) { v.enable_input() }
      setTimeout(() => v.show_msg(callback(v, curidx), { direct: direct }), v.timeout.ask)
    }
    v._choose_key = function (e) {
      let k = e.code
      if (k == 'ArrowDown' || k == 'ArrowUp' || k == 'Tab') {
        v.playSound('choicemove')
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
        v.ghostel.innerHTML = choices[curidx]
      } else if (k == 'Enter') {
        v.enterKey()
      }
      e.preventDefault()
    }

    for (let i = 0; i < choices.length; i++) {
      if (disabled_choices.indexOf(i) == -1) {
        cho = addEl(v.choose_input, 'div', 'choice')
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
    v.choose_input.onkeydown = onkeydown
    addAttrs(v.choose_input, { value: choices[curidx] })
    addAttrs(choices_btn[curidx], { checked: 'checked' })
    //    choices_btn[0].focus();
    v.scrl()
  },
  /** Question prompt **/
  ask: function (question, cb, args) {
    let v = this
    v.line = ''
    let reenable = v.disable_input()
    let choicebox = addEl(v.monitor, 'div', args.cls || 'choicebox')
    let create_answer = () => {
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
      v.answer_input.onkeyup = v._answer_key
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
    let end_answer = () => {
      if (args.disappear) args.disappear()
      if (reenable) v.enable_input()
    }
    let lock_answer = () => {
      v.answer_input.setAttribute('disabled', true)
      v.answer_input = undefined
      if (args.disappear) choicebox.outerHTML = ''
    }
    v._answer_key = args.ev || ((e) => {
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
      lock_answer()
      setTimeout(() => {
        ret = cb ? cb(ret) : ret
        end_answer()
        v.show_msg(ret)
      }, v.timeout.ask)
    }

    v.show_msg(question, { el: choicebox,
      cb: () => {
        setTimeout(create_answer, args.wait || 0)
        if (args.timeout) {
          setTimeout(v.enterKey, (args.wait || 0) + args.timeout)
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
    v.disable_input()
  },
  _end_password: function () {
    let v = this
    v.inputdiv.removeChild(v._div)
    v.password_input = undefined
    v._div = undefined
    v.enable_input()
  },
  _password_key: function (e) {
  // nothing
  },
  _ask_password_rec: function (cmdpass, callback) {
    let v = this
    if (cmdpass.length > 0) {
      let p = cmdpass.shift()
      let question = d(p.question, _('ask_password'))
      v.show_msg(question, { el: v._cur_box })
      v.enterKey = function () {
        v.playSound('choiceselect')
        let ret = v.password_input.value
        v.password_input.value = ''
        if (p.password === ret) {
          if (p.passok) {
            v.show_msg(p.passok, { el: v._cur_box })
          }
          v._ask_password_rec(cmdpass, callback)
        } else {
          if (p.passko) {
            v.show_msg(p.passko, { el: v._cur_box })
          }
          v.show_msg(callback(false, cmdpass), { el: v._cur_box })
          v._end_password()
        }
      }
      v.scrl()
    } else {
      v.show_msg(callback(true, cmdpass))
      v._end_password()
    }
  },
  // --------//
  // SOUND  //
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
    let v = this
    let idx = d(opt.index, -1)
    let im
    let imgs = v.imgs[idx]
    if (imgs && imgs.length > 0) {
      let c = addEl(v.monitor, 'div', 'img-container')
      while (im = imgs.shift()) {
        im.render(c, () => {
          v.scrl(1000)
        }
        )
      }
    }
  },
  rmCurrentImg: function (timeout) {
    let v = this
    setTimeout(function () {
      let y = v.current_msg.getElementsByClassName('img-container')
      let i
      for (i = 0; i < y.length; i++) {
        msg.removeChild(y[i])
      }
    }, timeout)
  }
}
