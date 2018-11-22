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
  t.version = 'beta~20181122'
  loadBackgroud('init')
  newRoom('fs', {group: 'root', owner: 'root',
    children: {
      bin: {
        items: {
          cat:{ nopo:['name'], cmd: 'less', mod:755},
          ls:{ nopo:['name'], cmd: 0, mod:755},
        }
      },
      boot: {},
      etc: {},
      home: { var:'$homedir',
        children: {
          sure: {var:'$home', group: 'user', owner: 'user'}
        }
      },
      lib: {},
      mnt: {},
      root: {},
      run: {},
      sbin: {},
      var: {}
    }
  })
  if (typeof doTest === 'function') {
    doTest(vt)
    return
  }
  loadLevel1()
  loadLevel2()
  t.menu()
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
    vt.clear()
    // prepare game loading
    let g = Game.prototype
    let hasSave = state.startCookie('terminus' + g.version)
    let choices = [_('cookie_yes_load'), _('cookie_yes'), _('cookie_no')]
    flash(0,550)
    // TODO : add checkbox for snd and textspeed
    // TODO : opt object for setting vt option
    if (d(state._get_pre('snd'), true)) {
      load_soundbank(vt)
    }
    vt.muteSound()
    setTimeout(() => {
      epic_img_enter(vt, 'titlescreen.gif', 'epic', 1500,
        () => {
          vt.unmuteSound()
          //        vt.playMusic('title',{loop:true});
          vt.ask_choose(_('cookie'), choices, g.start, {
            direct: true,
            disabled_choices: hasSave ? [] : [0]
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
      vt.unmuteSound()
      notification(_('game_loaded'))
      vt.show_msg(vt.ctx.h.r.getStarterMsg(_('welcome_msg', vt.ctx.h.me) + '\n'))
      vt.enable_input()
    } else {
      vt.ctx = new Context({
        users:{ 'sure': { groups: ['user'] } },
        me: 'sure',
        r:$home,
        v:{PATH:[$bin],HOME:$home}
      })
      vt.unmuteSound()
      vt.playMusic('preload')
      let loadel
      let loader = (title, id, val, duration, next) => {
        vt.show_msg(title, { cb: () => {
          loadel = dom.Id(id)
          vt.show_loading_element_in_msg(['/\'', '\'-', ' ,', '- '], {
            el: loadel,
            finalvalue: val,
            duration: duration,
            cb: next })
        } })
      }
      new Seq([
        (next) => {
        // vt.unmuteSound();
          vt.ask(_('prelude_text'), (val) => {
            if (_match('re_hate', val)) {
              vt.ctx.user.judged = _('user_judged_bad')
            } else if (_match('re_love', val)) {
              vt.ctx.user.judged = _('user_judged_lovely')
            } else {
              vt.ctx.user.judged = _('user_judged' + Math.min(5, Math.round(val.length / 20)))
            }
          },
          { cls: 'mystory', disappear: next}
          )
        }, (next) => {
          vt.ask(vt.ctx.user.judged + '\n' + _('username_prompt'),
            (val) => { vt.ctx.setUserName(val)},
            { placeholder: vt.ctx.h.me, cls: 'megaprompt', disappear: next, wait: 500 })
        },
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
          vt.muteSound()
          vt.show_loading_element_in_msg(['_', ' '], { duration: 800, finalvalue: ' ', cb: next })
        },
        (next) => {
          loader(_('gameintro_text_initrd'), 'initload',
            "<span class='color-ok'>" + _('gameintro_ok') + '</span>',
            800, next)
        },
        (next) => {
          loader(_('gameintro_text_domainname'), 'domainsetup',
            "<span class='color-ok'>" + _('gameintro_ok') + '</span>',
            800, next)
        },
        (next) => {
          loader(_('gameintro_text_fsck'), 'initfsck',
            "<span class='color-ko'>" + _('gameintro_failure') + '</span>',
            800, next)
        },
        (next) => {
          vt.show_msg(_('gameintro_text_terminus'), { cb: next })
        },
        (next) => {
          vt.show_msg(_('gamestart_text'))
          vt.unmuteSound()
          vt.playMusic('story')
          vt.enable_input()
          auto_shuffle_line(vt, _('press_enter'), 0.9, 0.1, 8, 20, null, 50)
        }
      ]).next()
    }
  }
}
