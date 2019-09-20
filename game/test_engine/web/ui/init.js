var vt = (new VTerm(dom.Id('term'))).addon(VTermImages, RES.img)

vt.on('ReturnStatement', function (ret) {
  console.log('ReturnStatement detected')
})

function buildTestEnv() {
  // define an home
  // POable.constructor_old = POable.constructor
  POable.nopo = ['name', 'text']
  $fs.newRoom('home').newRoom('test', {owner:'test'})
  // populate path /bin
  $fs.newRoom('bin')
  for (let c of Command.keys()){
    $bin.newItem(c, {cmd:c, mod:755})
  }
}

window.addEventListener('load', Game)
function Game () {
  console.log('--start engine test--')
  let state = File.prototype.STATE
  hasSave = state.startCookie('test_engine')
  cookie_question = _('cookie')
  cookie_choices = [_('cookie_yes_load'), _('cookie_yes'), _('cookie_no')]
  cookie_disabled_choices = hasSave ? [] : [0]
  cookie_parse_answer = function (useCookies){
    vt.clear()

    if (useCookies === 0) vt.env = state.loadEnv()
    else if (useCookies === 2)  state.stopCookie()

    if (vt.env.r) {
      state.loadActions()
      vt.enableInput()
    } else {
      buildTestEnv()
      vt.env = new Env({
        me: 'test', // current user
        r: $fs, // current working dir
        users: {
          test: { password: 'test', groups: ['user'], v: { HOME: $test.path, PATH: '/bin' } }
        }
      })
      vt.mute = 0
      vt.enableInput()
    }
  }
  vt.askChoose(cookie_question, cookie_choices, cookie_parse_answer,
    { direct: true, disabled_choices: cookie_disabled_choices })
}
