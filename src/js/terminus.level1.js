// $home - required - default room
newRoom('home', undefined, { writable: true })

$home.setEnterCallback(function () {
  music.play('forest')
})
  .addStates({
    poe_cmd_not_found: function (re) {
      vt.show_msg(_('cmd_poe_revealed'))
      vt.context.addGroup('poe')
      learn(vt, ['poe', 'pogen'], re)
    },
    cmd_not_found: function (re) {
      if (!re) {
        setTimeout(function () {
          console.log('usccess')
          vt.unmuteSound()
          mesg(_('very_first_try'), re)
          vt.unmuteCommandResult()
          $home.unsetCmdEvent('cmd_not_found')
          setTimeout(function () {
            vt.show_img()
            global_fire_done()
            state.saveCookie()
          }, 1300)
        }, 1000)
      }
    },
    less_no_arg: function (re) {
      $home.unsetCmdEvent('less_no_arg')
      mesg(_('cmd_cat_first_try'), re, { timeout: 500 })
    },
    destination_unreachable: function (re) {
      $home.unsetCmdEvent('destination_unreachable')
      mesg(_('cmd_cat_second_try'), re, { timeout: 1000 })
    }
  })

var shell_txt_id = 0
function shell_dial (re) {
  if (!isStr(shell_txt_id)) {
    if (shell_txt_id == 2) {
      pwddecl.fire_event(vt, 'less')
    }
    shelly.setTextIdx(++shell_txt_id % 7)
  }
  state.saveCookie()
}
shelly = $home.newPeople('shell')
  .setCmdEvent('exec_done', 'less_done')
  .addStates({
    less_done: shell_dial
  })

// WESTERN FOREST
$home.addPath(
  newRoom('western_forest', 'loc_forest.gif')
    .setEnterCallback(function () {
      music.play('forest')
    })
)
$western_forest.newItem('western_forest_academy_direction', 'item_sign.png')
var pwddecl = $western_forest.newItem('western_forest_back_direction')
  .addStates({
    less: function (re) {
      $western_forest.unsetCmdEvent('less')
      if (!_hasGroup('pwd')) {
        vt.context.addGroup('pwd')
        learn(vt, 'pwd', re)
      }
    }
  })

// SPELL CASTING ACADEMY
$western_forest.addPath(
  newRoom('spell_casting_academy', 'loc_academy.gif')
    .setEnterCallback(function () { music.play('academy') })
    .addPath(
      newRoom('academy_practice', 'loc_practiceroom.png', { writable: true }).addPath(
        newRoom('box', 'item_box.png', { writable: true })
          .setEnterCallback(function (r, vt) { enterRoom(r.parents[0], vt) })
      )
    )
    .addPath(
      newRoom('lessons', 'loc_classroom.gif')
    )
)

var prof = $lessons
  .newPeople('professor', 'item_professor.png')
  .addState('less', function (re) {
    prof.unsetCmdEvent('less')
    vt.context.addGroup('mv')
    learn(vt, 'mv', re)
  })

var mv_pr_sum = 0
function mv_sum (re) {
  mv_pr_sum++
  if (mv_pr_sum == 3) {
    $spell_casting_academy.setEnterCallback(null)
    if (re) {
      $western_forest.removePath($spell_casting_academy)
    } else {
      $spell_casting_academy.setLeaveCallback(function () {
        $western_forest.removePath($spell_casting_academy)
        if (!re) {
          success(vt, _('room_spell_casting_academy'), re)
        }
      })
    }
    if (!re) {
      ondone(function () {
        setTimeout(function () {
          snd.play('broken')
        }, 1000)
        setTimeout(function () {
          prof.moveTo($academy_practice)
          prof.setTextIdx('quit')
          $lessons.setTextIdx('escape')
          $lessons.setLeaveCallback(function () {
            $academy_practice.destroy()
          })
          music.play('warning', { loop: true })
          mesg(_('leave_academy'), re)
        }, 3000)
      })
    }
  }
  console.log('mv', mv_pr_sum)
}

$academy_practice.newItem('academy_practice', 'item_manuscript.png')
$academy_practice.newItemBatch('practice', [1, 2, 3], 'item_test.png')
  .map(function (i) {
    i
      .addState('mv', mv_sum)
  })

// EASTERN MOUNTAINS
man_sage = newRoom('mountain', 'loc_mountains.gif')
  .newPeople('man_sage', 'item_mysteryman.png')
  .addStates({
    less: function (re) {
      man_sage.unsetCmdEvent('less')
      vt.context.addGroup('exit')
      learn(vt, ['exit'], re)

      man = $mountain.newItem('man', 'item_manuscript.png')
        .setCmdEvent('less', 'manCmd')
        .setCmdEvent('less_done', 'trueStart')
        .addStates({
          manCmd: function (re) {
            man.unsetCmdEvent('less')
            vt.context.addGroup('help')
            learn(vt, ['man', 'help'], re)
          },
          trueStart: function (re) {
            man.unsetCmdEvent('less_done')
            music.play('yourduty', { loop: true })
          }
        })
    },
    less_done: function (re) {
      man_sage.disappear()
    }
  })

var poney_txt_id = 1
function poney_dial (re) {
  if (!isStr(poney_txt_id)) {
    poney.setTextIdx(poney_txt_id++)
    if (poney_txt_id == 5) {
      poney.setCmdEvent('less_done', 'uptxthint')
    }
  }
}
function poney_dialhint (re) {
  poney.setCmdEvent('less_done', 'uptxthint')
  if (!vt.statkey.Tab || vt.statkey.Tab == 0) {
    poney.setTextIdx('tab')
  } else if (!_hasGroup('mv')) {
    poney.setTextIdx('mv')
  } else if (!state.applied('mvBoulder')) {
    poney.setTextIdx('mountain')
  } else {
    poney.setTextIdx('help')
  }
}
// NORTHERN MEADOW
$home.addPath(
  newRoom('meadow', 'loc_meadow.gif')
)
var poney = $meadow
  .newPeople('poney', 'item_fatpony.png')
  .addStates({
    less: function (re) {
      $meadow.addPath($mountain)
      mesg(_('new_path', [$mountain]), re, { timeout: 600, ondone: true })
      unlock(vt, $mountain, re)
      poney.unsetCmdEvent('less')
    },
    less_done: poney_dial,
    uptxthint: poney_dialhint
  })

// CAVE / DARK CORRIDOR & STAIRCASE
$mountain.addPath(
  newRoom('cave', 'loc_cave.gif')
    .addPath(newRoom('dark_corridor', 'loc_corridor.gif'))
//  .addPath(newRoom('staircase', "loc_stair.gif"))
)
// $staircase.newItem('dead_end', "item_sign.png");

// DANK ROOM / SMALL HOLE
$dark_corridor.addPath(
  newRoom('dank', 'loc_darkroom.gif', { writable: true }).addCommand('mv')
    .addPath(
      newRoom('small_hole', undefined, { writable: true })
        .setCmdText('cd', _('room_small_hole_cd'))
    )
)
var boulder = $dank
  .newItem('boulder', 'item_boulder.png', { cls: 'large' })
  .addStates({
    mv: function (re) {
      if (!$dank.hasChild($tunnel)) {
        $dank.addPath($tunnel)
        //      boulder.unsetCmdEvent('mv');
        unlock(vt, $tunnel, re)
        if (re) {
          $dank.getItem('boulder').moveTo($small_hole)
        }
      }
    }
  })

// TUNNEL / STONE CHAMBER / PORTAL
var rat_txtidx = 1
newRoom('tunnel', 'loc_tunnel.gif').addPath(
  newRoom('stone_chamber', 'loc_portalroom.gif').addPath(
    newRoom('portal', 'item_portal.png')
      .setEnterCallback(function () {
        vt.playSound('portal')
        music.play('chapter1')
      })
  )
)
var rat = $tunnel
  .newPeople('rat', 'item_rat.png', { pic_shown_in_ls: false })
  .addStates({
    less_done: function (re) {
      rat.setCmdEvent('less_done', 'ratDial')
      rat.setPoDelta('_identified')
    },
    ratDial: function (re) {
      rat.setTextIdx(rat_txtidx++)
    }
  })

// ---------------END LEVEL 1-----------------
