// Initiate Game state - required to be called 'state'
// import { GameState, VTerm, _,  dom, _match, Seq, Context, pogencnt } from 'engine'
// import { snd, music } from 'terminus.assets'
// import { $home } from 'terminus.level1'
// import { doTest } from 'tests'
var state = new GameState() // GameState to initialize in game script
var vt = new VTerm('term')
window.addEventListener('load', Game)
function Game () {

  // TODO: set -o tofu --> mode tout le monde en cube
  let t = Game.prototype
  t.version = 'beta~20181123'
  loadBackgroud('init')
  newRoom('fs', {group: 'root', owner: 'root',
    children: {
      bin: { nopo:['name'],
        items: {
          cat:{ nopo:['name'], cmd: 'less', mod:755},
          ls:{ nopo:['name'], cmd: 0, mod:755},
          mv:{ nopo:['name'], cmd: 0, mod:750, group:0},
          touch:{ nopo:['name'], cmd: 0, mod:750, group:0},
          mkdir:{ nopo:['name'], cmd: 0, mod:750, group:0},
          rm:{ nopo:['name'], cmd: 0, mod:750, group:0},
          man:{ nopo:['name'], cmd: 0, mod:750, group:0},
          groups:{ nopo:['name'], cmd: 0, mod:750, group:'user'},
          whoami:{ nopo:['name'], cmd: 0, mod:750, group:'user'},
        }
      },
      boot: {nopo:['name'],},
      etc: {nopo:['name'],},
      home: { nopo:['name'], poid:'homedir',
        children: {
          sure: {var:'$home', poid:'home', group: 'user', owner: 'user'}
        }
      },
      lib: {nopo:['name'],},
      mnt: {nopo:['name'],},
      root: {nopo:['name'],},
      run: {nopo:['name'],},
      sbin: {nopo:['name'],},
      var: {nopo:['name'],}
    }
  })
  if (typeof doTest === 'function') {
    doTest(vt)
    return
  }
  loadLevel1()
  loadLevel2()

  t.hasSave = state.startCookie('terminus' + t.version)
  t.start(vt, 0)
  // t.menu()
  // new Seq([t.demo_note, t.menu]).next()
}
var visualchar = { 'ArrowUp': '↑', 'ArrowLeft': '←', 'ArrowRight': '→', 'ArrowDown': '↓', 'Tab': '↹' }
Game.prototype = {
  demo_note (next) {
    vt.ask_choose(_('demo_note'), [_('demo_note_continue')], next,
      { direct: true, cls: 'mystory' }
    )
  },
  menu (next) {
    flash(0,550)
    let g = Game.prototype
    vt.clear()
    // prepare game loading
    // TODO : add checkbox for snd and textspeed
    // TODO : opt object for setting vt option
    if (d(state._get_pre('snd'), true)) load_soundbank(vt)
    vt.mute = 1
    setTimeout(() => {
      epic_img_enter(vt, 'titlescreen.gif', 'epic', 1500,
        () => {
          vt.mute = 0
          //        vt.playMusic('title',{loop:true});
          vt.ask_choose(_('cookie'), 
            [_('cookie_yes_load'), _('cookie_yes'), _('cookie_no')],
            g.start, {
            direct: true,
            disabled_choices: g.hasSave ? [] : [0]
          })
        })
      showBackground()
    }, 500)
    setTimeout(() => {
      vt.show_msg('version : ' + g.version, { unbreakable: true })
    }, 1200)
  },
  start (vt, useCookies) {
    vt.clear()
    console.log('Start game')
    loadBackgroud('game')
    if (pogencnt > 0) vt.show_msg(_('pogen_alert', pogencnt), {cls: 'logging'})
    if (useCookies < 2) { // yes new game or load
      state.setCookieDuration(7 * 24 * 60) // in minutes
      if (useCookies == 0) vt.ctx = state.loadContext()
    } else state.stopCookie() // do not use cookie

    if (vt.ctx) {
      state.loadActions()
      vt.mute = 0
      notification(_('game_loaded'))
      vt.show_msg(_('welcome_msg', vt.ctx.me) + '\n' + vt.ctx.r.starterMsg)
      vt.enable_input()
    } else {
      vt.ctx = new Context({ me: 'sure', v:{PATH:[$bin], HOME:$home} })
      vt.mute = 0
      vt.playMusic('preload')
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
        (next) => {
          vt.mute = 1
          vt.show_loading_element_in_msg(['_', ' '], { duration: 800, finalvalue: ' ', cb: next })
        },
        (next) => {
          loader(_('gameintro_text_initrd'), 'initload', _('gameintro_ok'), 800, next)
        },
        (next) => {
          loader(_('gameintro_text_domainname'), 'domainsetup', _('gameintro_ok'), 800, next)
        },
        (next) => {
          loader(_('gameintro_text_fsck'), 'initfsck', _('gameintro_failure'),
            800, next)
        },
        (next) => { vt.show_msg(_('gameintro_text_terminus'), { cb: next }) },
        (next) => {
          vt.show_msg(_('gamestart_text'))
          vt.mute = 0
          vt.playMusic('story')
          vt.enable_input()
          auto_shuffle_line(vt, _('press_enter'), 0.9, 0.1, 8, 20, null, 50)
        }
      ]).next()
    }
  }
}
