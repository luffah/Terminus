
// ---------------LEVEL 2---------------------
// TOWN SQUARE
function loadLevel2 () {
  newRoom('townsquare', { img: 'loc_square.gif',
    music: 'chapter2',
    peoples: {
      citizen1: { img: 'item_citizen1.png',
        v: 1,
        states: {
          less_done: (re, o, e) => {
            o.setCmdEvent(e, 'talk')
            o.setPoDelta('_')
          },
          talk: (re, o) => { o.setTextIdx(o.v++) } } },
      citizen2: { img: 'item_citizen2.png' },
      citizen3: { img: 'item_lady.png',
        v: 1,
        states: {
          less_done: function (re, o, e) {
            o.setTextIdx(o.v++)
          } } } },
    children: {
      // BROKEN BRIDGE
      brokenbridge: { img: 'loc_bridge.gif',
        events: { touch: (ct) => { return (ct.arg === _('item_plank')) ? 'touchPlank' : '' } },
        states: { touchPlank: (re, o) => {
          $clearing.unsetCmd('cd').setPerm(777)
          o.text = _('room_brokenbridge_text2')
          ((re) ? o.newItem('plank') : o.getItem('plank')).img = 'item_plank.png'
        } } },
      // TOWN SQUARE / LIBRARY
      library: { img: 'loc_library.gif',
        items: {
          radspellbook: { img: 'item_radspellbook.png' },
          romancebook: { img: 'item_romancenovel.png' },
          historybook: { img: 'item_historybook.png' },
          nostalgicbook: { img: 'item_historybook.png',
            states: {
              less: () => { pwddecl.fire_event('less') } } },
          vimbook: { img: 'item_vimbook.png',
            states: { less: (re, o) => {
              if (!re) { flash(1600, 1000); vt.rmCurrentImg(2650) }
              o.disappear()
            } } },
          lever: { img: 'item_lever.png',
            mod: 777,
            states: {
              exec: function (re, o) {
                $library.addDoor($backroom)
                if (!re) vt.show_msg(_('item_lever_exec'))
                o.disappear()
              } } } } },
      // TOWN SQUARE / MARKETPLACE
      market: { img: 'loc_market.gif',
        mod: 777,
        v: [],
        peoples: {
          vendor: { img: 'item_merchant.png',
            events: {
              less_done: (ct, o) => {
                vt.show_img()
                vt.ask_choose(_('people_vendor_text'), [ _('people_vendor_sell_mkdir'),
                  _('people_vendor_sell_rm'), _('people_vendor_sell_nothing')],
                buy_to_vendor, { disabled_choices: o.room.v })
              },
              hooks: { rm: _('people_vendor_rm') }
            } } },
        items: {
          rm_spell: { img: 'item_manuscript.png' },
          mkdir_spell: { img: 'item_manuscript.png' },
          backpack: { img: 'item_backpack.png',
            events: {
              mv: (ct, o) => {
                vt.show_msg(_('item_backpack_stolen'))
                o.unsetCmdEvent('mv')
              } },
            states: {
              less: (re, o) => {
                vt.ctx.addGroup('unzip')
                learn(vt, 'unzip', re)
                o.unsetCmdEvent('less').setPoDelta(['.zip']).setCmdEvent('unzip', (ct) => {
                  unzipped = []
                  unzipped.push(ct.room.newItem('rm_cost'))
                  unzipped.push(ct.room.newItem('mkdir_cost'))
                  o.unsetCmdEvent('unzip').setPoDelta([])
                  vt.show_msg(_('unzipped', [_('item_backpack'), unzipped.join(', ')]), { unbreakable: true })
                })
              }
            }
          } },
        states: {
          rmSold: (re, o, e) => {
            vt.ctx.addGroup('rm')
            learn(vt, 'rm', re)
            o.removeItem('rm_spell')
            o.v.push(1)
            global_fire_done()
          },
          mkdirSold: (re, o, e) => {
            vt.ctx.addGroup('mkdir')
            learn(vt, 'mkdir', re)
            o.v.push(0)
            o.removeItem('mkdir_spell')
            global_fire_done()
          } } },
      // TOWN SQUARE / ROCKY PATH
      rockypath: { img: 'loc_rockypath.gif',
        mod: 777,
        items: {
          largeboulder: { img: 'item_boulder.png',
            states: {
              rm: (re, o) => {
                vt.show_msg(_('item_largeboulder_rm'))
                $rockypath.addDoor($farm)
                if (re) o.disappear()
              }
            } }
        } } }
  })
  $portal.newLink('townsquare', $townsquare)

  function buy_to_vendor (vt, choice) {
    if (choice == 0) {
      if ($market.hasItem('mkdir_cost')) {
        $market.removeItem('mkdir_cost')
        $market.apply('mkdirSold')
        return _('you_buy', [_('item_mkdir_spell')])
      } else {
        return _('need_money', [_('item_rm_spell')])
      }
    } else if (choice == 1) {
      if ($market.hasItem('rm_cost')) {
        $market.removeItem('rm_cost')
        $market.apply('rmSold')
        return _('you_buy', [_('item_rm_spell')])
      } else {
        return _('need_money', [_('rm_cost')])
      }
    }
  }

  // LIBRARY / BACK ROOM
  newRoom('backroom', { img: 'loc_backroom.gif',
    peoples: {
      grep: { img: 'grep.png', cmd:0,
        states: {
          less: (re,o,e) => {
            vt.ctx.addGroup('grep')
            o.name = 'grep'
            o.nopo = ['name']
            vt.ctx.h.v.PATH.push(o.room)
            learn(vt, 'grep', re)
          }
        } },
      librarian: { img: 'item_librarian.png' }
    } })

  // TOWN SQUARE / ARTISAN'S SHOP
  $townsquare.newRoom('artisanshop', { img: 'loc_artisanshop.gif',
    items: {
      strangetrinket: { img: 'item_trinket.png',
        hooks: { rm: _('item_strangetrinket_rm'), mv: _('item_strangetrinket_rm') }
      },
      dragon: { img: 'item_clockdragon.png',
        pic_shown_in_ls: false,
        hooks: { rm: _('item_dragon_rm'), mv: _('item_dragon_rm') }
      }
    },
    peoples: {
      artisan: { img: 'item_artisan.png',
        var: 0,
        states: {
          less: (re, o, e) => {
            vt.ctx.addGroup('touch')
            learn(vt, 'touch', re)
            o.unsetCmdEvent(e)
            state.saveCookie()
          }
        }
      }
    },
    events: {
      touch: (ct) => { if (ct.arg === _('item_gear')) { return 'touchGear' } },
      cp: (ct) => {
        let re = new RegExp(_('item_gear') + '\\d')
        if (re.test(ct.arg)) {
          for (let j = 1; j < 6; j++) {
            if (!ct.room.getItemFromName(_('item_gear', [j]))) {
              return ''
            }
          }
          return 'FiveGearsCopied'
        }
      }
    },
    states: {
      touchGear: (re) => {
        artisan.setHook('less', _('item_gear_touch'))
        vt.ctx.addGroup('cp')
        learn(vt, 'cp', re)
        (
          re ? $artisanshop.newItem('gear') : $artisanshop.getItem('gear')
        ).img = 'item_gear.png'
        state.saveCookie()
      },
      FiveGearsCopied: (re) => {
        artisan.setHook('less', _('item_gear_artisans_ok'))
        $artisanshop.removeItem('gear')
        if (!re) {
          for (let i = 1; i < 6; i++) $artisanshop.removeItem('gear', [i])
        }
        state.saveCookie()
      }
    }
  })

  // FARM
  newRoom('farm', { img: 'loc_farm.gif',
    items: { earofcorn: { img: 'item_corn.png',
      hooks: { rm: _('item_earofcorn_rm') },
      states: { cp: (re) => {
        farmer.setHook('less', _('corn_farmer_ok'))
        if (re) $farm.newItem('another_earofcorn')
      } }
    } },
    peoples: { farmer: { img: 'item_farmer.png', var: 0 } }
  })

  // CLEARING
  $brokenbridge.newRoom('clearing', { img: 'loc_clearing.gif',
    mod: 0,
    peoples: { cryingman: { img: 'item_man.png', var: 0 } },
    events: { mkdir: (ct) => { return (ct.arg == _('room_house') ? 'HouseMade' : '') } },
    hooks: { cd: _('room_clearing_cd') },
    states: {
      HouseMade: (re, o) => {
        if (re) { o.addDoor(newRoom('house')) }
        o.getChildFromName(_('room_house'))
          .setHook('cd', _('room_house_cd'))
          .setHook('ls', _('room_house_ls'))
        o.unsetHook('cd')
        o.text = _('room_clearing_text2')
        cryingman.setHook('less', _('room_clearing_less2'))
      }
    }
  })

  // OMINOUS-LOOKING PATH
  $clearing.newRoom('ominouspath', { img: 'loc_path.gif',
    mod: 777,
    items: { brambles: { img: 'item_brambles.png',
      cls: 'large',
      hooks: { mv: _('item_brambles_mv'), rm: _('item_brambles_rm') },
      states: { rm: (re, o) => {
        $ominouspath.addDoor($trollcave)
        if (re) o.disappear()
      } }
    } }
  })

  // CAVE
  var troll_evt = function (ct) {
    return (ct.arg == 'UglyTroll' ? 'openSlide' : '')
  }
  newRoom('trollcave', { img: 'loc_cave.gif',
    writable: true,
    events: { mv: troll_evt, rm: troll_evt },
    people: {
      troll1: { img: 'item_troll1.png',
        events: { mv: 'openSlide', rm: 'openSlide' },
        states: { openSlide: (re, o) => {
          $slide.chmod(777)
          if (re) o.disappear()
        } } },
      troll2: { img: 'item_troll2.png', hooks: { rm: _('people_troll11_rm') } },
      supertroll: { img: 'item_supertroll.png',
        events: {
          rm: () => { vt.show_msg(_('people_supertroll_rm')) },
          mv: () => { vt.show_msg(_('people_supertroll_mv')) }
        } }
    },
    children: {
      cage: { img: 'item_cage.png',
        cls: 'covering',
        mod: 666,
        pic_shown_as_item: true,
        hooks: { cd: (args) => { { ret:_stdout(_('room_cage_cd')) } } },
        peoples: {
          kidnapped: { img: 'item_boy.png',
            states: {
              mv: (re, o) => {
                vt.show_msg(_('people_kidnapped_mv'))
                o.moveTo($clearing)
              } } } } },
      slide: { mod: 0,
        hooks: { cd: _('room_slide_cd') } }
    }
  })

  // .setHook("rm", _('people_troll11_rm'))
  // .setHook("mv", _('people_troll11_mv'))

  // KERNEL FILES
  //
  // TODO: utiliser le fameux fichier du début pour trouver quoi faire du sudo
  $slide.newRoom('kernel', {
    items: {
      certificate: {},
      instructions: {
        states: {
          less: function (re) {
            vt.ctx.addGroup('sudo')
            learn(vt, 'sudo', re)
          }
        }
      }
    },
    states: {
      sudoComplete: function (re) {
        $kernel.addDoor($paradise)
        vt.show_msg(_('room_kernel_sudo'))
      }
    },
    children: {
      morekernel: {
        items: {
          'bigfile{L,M,P,Q,R,S,U,V,W}': {},
          bigfile: { povars: ['T'],
            hooks: {
              grep: (args) => {
                if (args[0].indexOf('pass') == 0) return { ret: _stdout('password = IFHTP'), pass: true }
              } }
          } } },
      // PARADISE (end game screen)
      paradise: { img: 'loc_theend.gif',
        hooks: { ls: _('room_paradise_ls') }
      }
    }
  })
}
