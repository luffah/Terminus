// Initiate Game state - required to be called 'state'
// import { GameState, VTerm, _,  dom, _match, Seq, Context, pogencnt } from 'engine'
// import { snd, music } from 'terminus.assets'
// import { $home } from 'terminus.level1'
// import { TESTING, doTest } from 'tests'
var state = new GameState() // GameState to initialize in game script
var vt = new VTerm('term')
vt.soundbank = snd
var version = '0.2beta'
window.addEventListener("load", function(event) {
  var loadel
  // prepare game loading
  var hasSave = state.startCookie('terminus' + version)
  var choices = [_('cookie_yes'), _('cookie_no')]
  if (hasSave) choices.unshift(_('cookie_yes_load'))
  console.log('Start game')

  var start = function (vt, useCookies) {
    var context = false
    vt.muteSound()
    if (pogencnt > 0) { vt.show_msg(_('pogen_alert', pogencnt)) }
    if ((useCookies - (hasSave ? 1 : 0)) <= 0) { // yes new game or load
      state.setCookieDuration(7 * 24 * 60)// in minutes
      if (useCookies === 0) { // load
        if (state.loadCookie()) {
          context = state.getCurrentContext()
        }
      }
    } else { // do not use cookie
      state.stopCookie()
    }
    vt.clear()
    if (context) {
      vt.setContext(context)
      vt.unmuteSound()
      vt.notification(_('game_loaded'))
      vt.show_msg(vt.context.getStarterMsg(_('welcome_msg', [vt.context.user.name]) + '\n'))
      vt.enable_input()
    } else {
      context = new Context({ 'sure': { groups: [], address: 'DTC' } }, 'sure', $home, {})
      vt.setContext(context)
      vt.unmuteSound()
      vt.muteCommandResult()
      vt.context.addGroup('cat')
      vt.context.addGroup('dir')
      music.play('preload')
      var seq = new Seq()
      seq.then(function (next) {
        // vt.unmuteSound();
        vt.ask(_('prelude_text'), function (val) {
          if (_match('re_hate', val)) {
            vt.context.user.judged = _('user_judged_bad')
          } else if (_match('re_love', val)) {
            vt.context.user.judged = _('user_judged_lovely')
          } else {
            vt.context.user.judged = _('user_judged' + Math.min(5, Math.round(val.length / 20)))
          }
        },
        { cls: 'mystory', disappear: function (cb) { cb(); next() }
        }
        )
      })
      seq.then(function (next) {
        vt.ask(vt.context.user.judged + '\n' + _('username_prompt'), function (val) { vt.context.setUserName(val); next() }, { placeholder: vt.context.currentuser, cls: 'megaprompt', disappear: function (cb) { cb() }, wait: 500 })
      })
      seq.then(function (next) {
        vt.ask(_('useraddress_prompt'), function (val) { vt.context.setUserAddress(val); next() }, { placeholder: vt.context.user.address,
          cls: 'megaprompt',
          disappear: function (cb) {
            cb()
          },
          wait: 500 })
      })
      seq.then(function (next) {
        vt.ask(_('gameintro_setup_ok'), function (val) {
        },
        { value: '_ _ _ !',
          cls: 'mystory',
          evkey: {
            'ArrowUp': function () {
              vt.answer_input.value = '_ ↑ _ ?'
            },
            'ArrowLeft': function () {
              vt.answer_input.value = '← _ _ ?'
            },
            'ArrowRight': function () {
              vt.answer_input.value = '_ _ → ?'
            },
            'ArrowDown': function () {
              vt.answer_input.value = '_ ↓ _ ?'
            },
            'Tab': function () {
              vt.answer_input.value = '_ ↹ _ ?'
            }
          },
          disappear: function (cb) {
            cb()
            vt.flash(0, 800)
            next()
          }
        }
        )
      })
      seq.then(function (next) {
        vt.show_loading_element_in_msg(['_', ' '], { duration: 800, finalvalue: ' ', callback: next })
      })
      seq.then(function (next) {
        vt.muteSound()
        vt.show_loading_element_in_msg(['_', ' '], { duration: 800, finalvalue: ' ', callback: next })
      })
      seq.then(function (next) {
        vt.show_msg(_('gameintro_text_initrd'), { cb: next })
      })
      seq.then(function (next) {
        loadel = dom.Id('initload')
        vt.show_loading_element_in_msg(['/\'', '\'-', ' ,', '- '], {
          el: loadel,
          finalvalue: "<span class='color-ok'>" + _('gameintro_ok') + '</span>',
          duration: 800,
          callback: next })
      })
      seq.then(function (next) {
        vt.show_msg(_('gameintro_text_domainname'), { cb: next })
      })
      seq.then(function (next) {
        loadel = dom.Id('domainsetup')
        vt.show_loading_element_in_msg(['/\'', '\'-', ' ,', '- '], {
          el: loadel,
          finalvalue: "<span class='color-ok'>" + _('gameintro_ok') + '</span>',
          duration: 800,
          callback: next })
      })
      seq.then(function (next) {
        vt.show_msg(_('gameintro_text_fsck'), { cb: next })
      })
      seq.then(function (next) {
        loadel = dom.Id('initfsck')
        vt.show_loading_element_in_msg(['/\'', '\'-', ' ,', '- '], {
          el: loadel,
          finalvalue: "<span class='color-ko'>" + _('gameintro_failure') + '</span>',
          duration: 800,
          callback: next })
      })
      seq.then(function (next) {
        vt.show_msg(_('gameintro_text_terminus'), { cb: next })
      })
      seq.then(function (next) {
        vt.show_msg(_('gamestart_text'))
        vt.unmuteSound()
        music.play('story')
        vt.enable_input()
        vt.auto_shuffle_input_msg(_('press_enter'), 0.9, 0.1, 8, 20, null, 50)
      })
      seq.next()
    }
  }
  // vt.epic_img_enter('terminus_logo.png','epicfromright titlelogo',800,
  if (TESTING) {
    vt.setContext(state.getCurrentContext())
    vt.enable_input()
    doTest(vt)
  } else {
    vt.flash(0, 800)
    vt.epic_img_enter('titlescreen.gif', 'epicfromright', 800,
      function (vt) {
        vt.show_msg('version : ' + version)
        //        music.play('title',{loop:true});
        vt.ask_choose(_('cookie'), choices, start, { direct: true })
      })
  }
})
/**
 * API:
 * CREATE ROOMS, ITEMS and PEOPLES
 *     <Room>=newRoom(id, img, props) set a new room variable named $id
 *     <Item>=<Room>.newItem(id, img)
 *     <People>=<Room>.newPeople(id, img)
 *     id : non 'room_' part of a key 'room_<id>' in GameDialogs file
 *              GameDialogs file shall contain :
 *               - room_<roomid> :      the name of the room
 *               - room_<roomid>_text : the description of what happening in
 *                                      the room
 *          non 'item_' (or 'people_') part of a key 'item_<id>' in GameDialogs file
 *              GameDialogs file shall contain :
 *               - item_<id>   :      the name of the item
 *              ( - people_<id> :      the name of the person )
 *               - item_<id>_text   : a description
 *              ( - people_<id>_text : a description )
 *     img : img file in image directory
 *
 *     props : hash without many optionnal properties like executable, readable, writable
 *
 *    Return the <Room> object and define $varname variable (='$'+id)
 *
 *    Note : $home is required , in order to define path '~/', and command 'cd'.
 *
 * CONNECT ROOMS
 *    <Room>.addPath(<Room>)
 *
 * FIRST PROMPT
 *    If the player start a game or load it from saved state,
 *    you can display a message for the room she/he starts.
 *    Default is the result of 'pwd'.
 *    <Room>.setStarterMsg(<welcome_message>);
 *
 * COMMANDS
 *    // alter result of the command
 *    <Room>.setCmdText(<cmd_name>,<cmd_result>)
 *    <Item>.setCmdText(<cmd_name>,<cmd_result>)
 *
 */
// All bash shortcuts : https://ss64.com/bash/syntax-keyboard.html
