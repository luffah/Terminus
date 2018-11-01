function loadLevel1 () {
  $home
    .setEnterCallback(() => { playMusic('forest') })
    .addStates({
      poe_cmd_not_found: (re) => {
        mesg(_('cmd_poe_revealed'), re)
        addGroup('poe')
        learn(['poe', 'pogen'], re)
      },
      cmd_not_found: (re) => {
        $home.unsetCmdEvent('cmd_not_found')
        addGroup('cat')
        addGroup('dir')
        $home.owner = vt.context.currentuser
        if (!re) {
          setTimeout(() => {
            mesg(_('very_first_try'), re)
            setTimeout(function () {
              vt.show_img()
              global_fire_done()
              state.saveCookie()
            }, 1300)
          }, 1000)
        }
      },
      less_no_arg: (re) => {
        $home.unsetCmdEvent('less_no_arg')
        mesg(_('cmd_cat_first_try'), re, { timeout: 500 })
      },
      room_unreachable: 'item_not_exists',
      item_not_exists: (re) => {
        $home.unsetCmdEvent('item_not_exists')
        mesg(_('cmd_cat_second_try'), re, { timeout: 1000 })
      } })
    .where_u_meet('shell', { var: 'shelly',
      v: 0,
      events: { exec_done: 'less_done' },
      states: { less_done: (re) => {
        if (shelly.v == 2) {
          pwddecl.fire_event(vt, 'less')
        }
        shelly.setTextIdx(++shelly.v % 7)
      } } })
    // WESTERN FOREST -> SPELL CASTING ACADEMY
    .go(
      into('western_forest', 'loc_forest.gif', { enterCallback: () => { playMusic('forest') } })
        .where_u_find('western_forest_academy_direction', 'item_sign.png')
        .where_u_find('western_forest_back_direction', undefined, { var: 'pwddecl',
          events: { less: (re) => {
            $western_forest.unsetCmdEvent('less')
            addGroup('pwd')
            learn('pwd', re)
          } } })
        .go(
          into('spell_casting_academy', 'loc_academy.gif', { enterCallback: () => { playMusic('academy') } })
            .then('lessons', 'loc_classroom.gif')
            .where_u_meet('professor', 'item_professor.png', { var: 'prof',
              states: { less: (re) => {
                prof.unsetCmdEvent('less')
                addGroup('mv')
                learn('mv', re)
              } } })
            .or()
            .then('academy_practice', 'loc_practiceroom.png', { v: 0, mod: '777' })
            .where_u_find('academy_practice', 'item_manuscript.png')
            .where_u_findMany('practice', [1, 2, 3], 'item_test.png', {
              states: { mv_done: (re) => {
                if (++$academy_practice.v == 3) {
                  $spell_casting_academy.setEnterCallback(null)
                  if (re) { $spell_casting_academy.chmod('-x') } else {
                    $spell_casting_academy.setLeaveCallback(() => {
                      $spell_casting_academy.chmod('-x')
                      playMusic()
                      success(_('room_spell_casting_academy'), re)
                    })
                    ondone(function () {
                      setTimeout(() => { playSound('broken') }, 1000)
                      setTimeout(() => {
                        prof.moveTo($academy_practice).setTextIdx('quit')
                        $lessons.setLeaveCallback(() => { $academy_practice.destroy() }).setTextIdx('escape')
                        playMusic('warning', { loop: true })
                        mesg(_('leave_academy'), re)
                      }, 3000)
                    })
                  }
                }
              } } })
            .then('box', 'item_box.png', { mod: '766' })
        )
    )
    // NORTHERN MEADOW
    .go(
      into('meadow', 'loc_meadow.gif')
        .where_u_meet('poney', 'item_fatpony.png', { var: 'poney',
          v: 0,
          states: {
            less: function (re) {
              $meadow.go($mountain)
              mesg(_('new_path', [$mountain]), re, { timeout: 600, ondone: true })
              unlock(vt, $mountain, re)
              poney.unsetCmdEvent('less')
            },
            less_done: (re) => {
              poney.setTextIdx(++poney.v)
              if (poney.v == 5) {
                poney.setCmdEvent('less_done', 'uptxthint')
              }
            },
            uptxthint: (re) => {
              poney.setCmdEvent('less_done', 'uptxthint')
              if (!vt.statkey.Tab || vt.statkey.Tab == 0) {
                poney.setTextIdx('tab')
              } else if (!vt.context.hasGroup('mv')) {
                poney.setTextIdx('mv')
              } else if (!state.applied('mvBoulder')) {
                poney.setTextIdx('mountain')
              } else {
                poney.setTextIdx('help')
              }
            } } })
    )

  // Mountain // CAVE / DARK CORRIDOR & STAIRCASE
  into('mountain', 'loc_mountains.gif')
    .where_u_meet('man_sage', 'item_mysteryman.png', { var: 'man_sage',
      states: {
        less: (re) => {
          man_sage.unsetCmdEvent('less')
          addGroup('exit')
          learn(['exit'], re)
          man = $mountain.find('man', 'item_manuscript.png')
            .setCmdEvent('less', 'manCmd')
            .setCmdEvent('less_done', 'trueStart')
            .addStates({
              manCmd: (re) => {
                man.unsetCmdEvent('less')
                addGroup('help')
                learn(['man', 'help'], re)
              },
              trueStart: (re) => {
                man.unsetCmdEvent('less_done')
                playMusic('yourduty', { loop: true })
              } })
        },
        less_done: function (re) {
          man_sage.disappear()
        } } })
    .go(
      into('cave', 'loc_cave.gif')
        .then('dark_corridor', 'loc_corridor.gif')
        .then('dank', 'loc_darkroom.gif', { mod:775 })
        .where_u_find('boulder', 'item_boulder.png', { cls: 'large',
          states: {
            mv: (re) => {
              if (!$dank.hasChild($tunnel)) {
                $dank.go($tunnel)
                unlock(vt, $tunnel, re)
                if (re) {
                  $dank.getItem('boulder').moveTo($small_hole)
                }
              }
            }
          } })
        .then('small_hole', undefined, { mod:775,
          hooks: {
            'cd': (args) => { return { ret: _stdout(_('room_small_hole_cd')) } }
          } })
    )

  // TUNNEL / STONE CHAMBER / PORTAL
  into('tunnel', 'loc_tunnel.gif')
    .where_u_meet('rat', 'item_rat.png', { var: 'rat',
      v: 0,
      pic_shown_in_ls: false,
      states: {
        less_done: (re) => {
          rat.setCmdEvent('less_done', 'ratDial')
          rat.setPoDelta('_identified')
        },
        ratDial: (re) => {
          rat.setTextIdx(++rat.v)
        } } })
    .go(
      into('stone_chamber', 'loc_portalroom.gif')
        .then('portal', 'item_portal.png', {
          enterCallback: () => {
            playSound('portal')
            playMusic('chapter1')
          }
        })
    )
}
// ---------------END LEVEL 1-----------------
