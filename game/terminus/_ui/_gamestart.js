function loadSoundBank () {
  if (vt.soundbank) return
  vt.soundbank = new SoundBank(RES.sound)
  vt.musicbank = new Music(vt.soundbank, RES.music)
}
// var visualchar = { 'ArrowUp': '↑', 'ArrowLeft': '←', 'ArrowRight': '→', 'ArrowDown': '↓', 'Tab': '↹' }
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
    if (state.getopt('snd', true)) loadSoundBank(vt)
    vt.mute = 1
    setTimeout(() => {
      showEpicImg(vt, 'title', 'epic', 1500,
        () => {
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
  start (vt, useCookies) {
    vt.clear()
    console.log('Start game')
    loadBackgroud('game')
    if (state.getopt('snd', true)) loadSoundBank(vt)
    if (pogencnt > 0) vt.echo(_('pogen_alert', pogencnt), { direct: 1, cls: 'logging' })
    if (useCookies < 2) { // yes new game or load
      state.setCookieDuration(7 * 24 * 60) // in minutes
      if (useCookies === 0) vt.ctx = state.loadContext()
    } else state.stopCookie() // do not use cookie

    if (vt.ctx) {
      state.loadActions()
      vt.mute = 0
      notification(_('game_loaded'))
      vt.echo(_('welcome_msg', vt.ctx.me) + '\n' + vt.ctx.r.starterMsg)
      vt.enableInput()
    } else {
      vt.ctx = new Context({ me: 'sure', v: { PATH: [$bin], HOME: $sure } })
      vt.mute = 0
      new Seq([
        // (next) => {
        //   vt.ask(_('prelude_text'), (val) => {
        //     if (_match('re_hate', val)) {
        //       vt.ctx.user.judged = _('user_judged_bad')
        //     } else if (_match('re_love', val)) {
        //       vt.ctx.user.judged = _('user_judged_lovely')
        //     } else {
        //       vt.ctx.user.judged = _('user_judged' + Math.min(5, Math.round(val.length / 20)))
        //     }
        //   },
        //   { cls: 'mystory', disappear: next}
        //   )
        // },
        // (next) => {
        //   vt.ask(vt.ctx.user.judged + '\n' + _('username_prompt'),
        //     (val) => { vt.ctx.me = val},
        //     { placeholder: vt.ctx.me, cls: 'megaprompt', disappear: next, wait: 500 })
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
          vt.playMusic('story')
          vt.enableInput()
          autoShuffleLine(vt, '# ' + _('press_enter'), 0.9, 0.1, 8, 166, null, 10)
          window.onbeforeunload = function (e) {
            return 'Quit the game ?'
          }
        }
      ]).next()
    }
  }
}
