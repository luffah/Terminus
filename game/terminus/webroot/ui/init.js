var vt = (new VTerm(dom.Id('term'))).addon(VTermImages, RES.img)
invidiv = addEl(vt.cmdinput, 'pre', {class: 'invidiv'})
cursorblock = addEl(vt.cmdinput, 'div', {
  class:'cursorblock',
})
CursorListener.push((k, pos) => {
  invidiv.innerText = vt.input.value.slice(0, pos)
  cursorblock.innerText = (vt.input.value[pos] || ' ').replace(' ', ' ')
  cursorblock.style.left = (vt.input.offsetLeft + invidiv.offsetWidth) + 'px'
})

var bottom = vt.container.style.bottom = 0
window.onwheel = function(e) {
  vt.input.blur()
  if (e.deltaY){
    bottom += (e.deltaY < 0 ? -1 : 1)
    if (bottom < 0){
      vt.container.style.bottom = bottom + 'em';
    }
  }
}
vt.on('InputFocused', function(){
  bottom = vt.container.style.bottom = 0
})

function loadSoundBank () {
  if (vt.soundbank) return
  vt.addon(VTermAudio, RES)
}

window.addEventListener('load', Game)
function Game () {
  let g = Game.prototype
  g.version = CREDITS.game.version
  g.title = CREDITS.game.title
  g.state = File.prototype.STATE
  loadBackgroud('init')
  if (typeof doTest === 'function') {
    doTest(vt)
    return
  }
  g.hasSave = g.state.startCookie(g.title + g.version)
  g.start()
  // g.menu()
  // new Seq([g.demo_note, g.menu]).next()
}
Game.prototype = {
  demo_note (next) {
    vt.askChoose(_('demo_note'), [_('demo_note_continue')], next,
      { direct: true, cls: 'mystory' }
    )
  },
  menu (next) {
    flash(0, 550)
    let g = Game.prototype
    vt.clear()
    // prepare game loading
    // TODO : add checkbox for snd and textspeed
    if (g.state.getopt('snd', true)) loadSoundBank(vt)
    vt.mute = 1
    setTimeout(() => {
      showEpicImg(vt, 'title', 'epic', 1500,
        () => {
          console.log('to')
          vt.mute = 0
          //        vt.playMusic('title',{loop:true});
          vt.askChoose(_('cookie'),
            [_('cookie_yes_load'), _('cookie_yes'), _('cookie_no')],
            g.start, {
              direct: true,
              disabled_choices: g.hasSave ? [] : [0]
            })
        })
      showBackground()
    }, 500)
    setTimeout(() => {
      vt.echo('version : ' + g.version, { unbreakable: true })
    }, 1200)
  },
  start (useCookies) {
    let g = this
    vt.clear()
    console.log('Start game')
    loadBackgroud('game')
    if (g.state.getopt('snd', true)) loadSoundBank(vt)
    if (pogencnt > 0) vt.echo(_('pogen_alert', pogencnt), { direct: 1, cls: 'logging' })
    if (useCookies < 2) { // yes new game or load
      g.state.setCookieDuration(7 * 24 * 60) // in minutes
      if (useCookies === 0) vt.env = g.state.loadEnv()
    } else g.state.stopCookie() // do not use cookie

    $bin.newLink('grep', {nopo:['name'],tgt:$backroom.items[0]})
    if (vt.env.r) {
      g.state.loadActions()
      vt.mute = 0
      notification(_('game_loaded'))
      vt.echo(_('welcome_msg', vt.env.me) + '\n' + vt.env.r.starterMsg)
      vt.enableInput()
    } else {
      vt.env = new Env({
        me: 'sure', // current user
        r: $sure, // current working dir
        users: {
          sure:{groups:[], v:{HOME:$sure.path, PATH:$bin.path}}
        }
      })
      vt.env.addGroup('user')
      vt.mute = 0
      new Seq([
        // (next) => {
        //   vt.ask(_('prelude_text'), (val) => {
        //     if (_match('re_hate', val)) {
        //       vt.env.user.judged = _('user_judged_bad')
        //     } else if (_match('re_love', val)) {
        //       vt.env.user.judged = _('user_judged_lovely')
        //     } else {
        //       vt.env.user.judged = _('user_judged' + Math.min(5, Math.round(val.length / 20)))
        //     }
        //   },
        //   { cls: 'mystory', disappear: next}
        //   )
        // },
        // (next) => {
        //   vt.ask(vt.env.user.judged + '\n' + _('username_prompt'),
        //     (val) => { vt.env.me = val},
        //     { placeholder: vt.env.me, cls: 'megaprompt', disappear: next, wait: 500 })
        // },
        // (next) => {
        //   vt.ask(_('gameintro_setup_ok'), (val) => {
        //   },
        //   { value: '_ _ _ !',
        //     cls: 'mystory',
        //     readOnly: true,
        //     anykeyup: (t, e) => {
        //       let c = visualchar[e.key] || e.key
        //       if (e.ctrlKey) {
        //         t.answer_input.value = '_ ^' + c.toUpperCase() + ' _'
        //       } else {
        //         t.answer_input.value = '_ ' + c + ' _'
        //       }
        //       e.preventDefault()
        //     },
        //     disappear: () => {
        //       flash()
        //       next()
        //     }
        //   }
        //   )
        // },
        // (next) => {
        //   vt.mute = 1
        //   let sp = dom.El('span')
        //   vt.echo(sp)
        //   animElContent(sp, ['_', ' '], { finalvalue: ' ', duration: 1200, cb: next })
        // },
        // (next) => {
        //   loader(_('gameintro_text_initrd'), 'initload', _('gameintro_ok'), 800, next)
        // },
        // (next) => {
        //   loader(_('gameintro_text_domainname'), 'domainsetup', _('gameintro_ok'), 800, next)
        // },
        // (next) => {
        //   loader(_('gameintro_text_fsck'), 'initfsck', _('gameintro_failure'),
        //     2600, next)
        // },
        (next) => { vt.echo(_('gameintro_text'), { cb: next }) },
        (next) => {
          vt.echo(_('gamestart_text'))
          vt.mute = 0
          // vt.playMusic('story')
          vt.enableInput()
          CursorListener.fire() // FIXME add automatically a start... the pd come from the initialisation sequence...
          // autoShuffleLine(vt, '# ' + _('press_enter'), 0.9, 0.1, 8, 166, null, 10)
          window.onbeforeunload = function (e) {
            return 'Quit the game ?'
          }
        }
      ]).next()
    }
  }
}
