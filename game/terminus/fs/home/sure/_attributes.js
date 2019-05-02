({
  music: 'forest',
  states: {
    poe_cmd_not_found: (re) => {
      mesg(_('cmd_poe_revealed'), re)
      Builtin.unhide('poe')
      learn(['poe', 'pogen'], re)
    },
    cmd_not_found: (re, o, e) => {
      o.unsetCmdEvent(e)
      o.owner = vt.ctx.h.me
      if (!re) {
        setTimeout(() => {
          mesg(_('very_first_try'), re)
          setTimeout(() => {
            globalFireDone()
            state.saveCookie()
          }, 1300)
        }, 1000)
      }
    },
    less_no_arg: (re, o, e) => {
      o.unsetCmdEvent(e)
      mesg(_('cmd_cat_first_try'), re, { timeout: 500 })
    },
    room_unreachable: 'item_not_exists',
    item_not_exists: (re, o, e) => {
      o.unsetCmdEvent(e)
      mesg(_('cmd_cat_second_try'), re, { timeout: 1000 })
    }
  }
})
