function loadLevel1 () {

  $home
    .set({ music: 'forest', states: {
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
                vt.show_img()
                global_fire_done()
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
      },
      peoples: {
        shell: {
          v: 0,
          events: { exec_done: 'less_done' },
          states: {
            less_done: (re, o) => {
              if (o.v == 2) pwddecl.fire_event(vt, 'less')
              o.setTextIdx(++o.v % 7)
            }
          }
        }
      }
    })

    .addRoom('western_forest', {
      img: 'loc_forest.gif',
      music: 'forest',
      items: {
        western_forest_academy_direction: { img: 'item_sign.png' },
        western_forest_back_direction: { var: 'pwddecl',
          states: { less: (re) => {
            $western_forest.unsetCmdEvent('less')
            addGroup('pwd')
            learn('pwd', re)
          } } } },
      children: {
        spell_casting_academy: {
          img: 'loc_academy.gif',
          music: 'academy',
          children: {
            lessons: {
              img: 'loc_classroom.gif',
              people: {
                professor: {
                  img: 'item_professor.png',
                  var: 'prof',
                  states: { less: (re) => {
                    prof.unsetCmdEvent('less')
                    addGroup('mv')
                    learn('mv', re)
                  } }
                }
              }
            },
            academy_practice: { img: 'loc_practiceroom.png',
              v: 0,
              mod: '777',
              items: {
                academy_practice: { img: 'item_manuscript.png' },
                'practice{1,2,3}': { img: 'item_test.png',
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
                  }
                  } } },
              children: {
                box: { img: 'item_box.png', mod: '766' }
              }
            }
          } } } }
    )
    .addRoom('meadow', { img: 'loc_meadow.gif',
      peoples: {
        poney: { img: 'item_fatpony.png',
          var: 0, v: 0,
          states: {
            less: function (re) {
              $meadow.addDoor($mountain)
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
              } else if (!vt.ctx.hasGroup('mv')) {
                poney.setTextIdx('mv')
              } else if (!state.applied('mvBoulder')) {
                poney.setTextIdx('mountain')
              } else {
                poney.setTextIdx('help')
              }
            }
          } }
      } }
    )

  newRoom('mountain', { img: 'loc_mountains.gif',
    peoples: {
      man_sage: { img: 'item_mysteryman.png',
        states: {
          less: (re, o, e) => {
            o.unsetCmdEvent(e)
            addGroup('exit')
            learn(['exit'], re)
            man = $mountain.newItem('man', { img: 'item_manuscript.png',
              states: {
less: (re , it, e) => {
                  it.unsetCmdEvent(e)
                  addGroup('help')
                  learn(['man', 'help'], re)
                },
                less_done: (re, it, e) => {
                  it.unsetCmdEvent(e)
                  playMusic('yourduty', { loop: true })
                } 
              }
            })
          },
          less_done: (re, o) => {
            o.disappear()
          }
        } }
    },
    children: {
      cave: { img: 'loc_cave.gif',
        children: {
          dark_corridor: { img: 'loc_corridor.gif',
            children: {
              dank: { img: 'loc_darkroom.gif',
                mod: 755,
                items: {
                  boulder: { img: 'item_boulder.png',
                    cls: 'large',
                    states: {
                      mv: (re, o) => {
                        if (!$dank.hasChild($tunnel)) {
                          $dank.addDoor($tunnel)
                          unlock(vt, $tunnel, re)
                          if (re) {
                            o.moveTo($small_hole)
                          } } }
                    },
                    children: {
                      small_hole: { mod: 755,
                        hooks: {
                          cd: (args) => { return { ret: _stdout(_('room_small_hole_cd')) } }
                        } }
                    } }
                } }
            } }
        } }
    } })

  // TUNNEL / STONE CHAMBER / PORTAL
  newRoom('tunnel', { img: 'loc_tunnel.gif',
    peoples : {
      rat: { img: 'item_rat.png',
      v: 0,
      pic_shown_in_ls: false,
      states: {
        less_done: (re, o) => {
          o.setCmdEvent('less_done', 'ratDial')
          o.setPoDelta('_identified')
        },
        ratDial: (re, o) => {
          o.setTextIdx(++o.v)
        }
      } } 
    }, 
    children: {
      stone_chamber : { img: 'loc_portalroom.gif' },
      portal : { img: 'item_portal.png',
      enterCallback: () => {
        playSound('portal')
        playMusic('chapter1')
      } }
    }
  })
}
// ---------------END LEVEL 1-----------------
