
//---------------LEVEL 2---------------------
//TOWN SQUARE
$portal.addPath(
  newRoom("townsquare", "loc_square.gif")
);
$townsquare.setEnterCallback(function(){
  music.play('chapter2',{loop:true});
});
var mayor_txtidx=1;
var mayor=$townsquare.newPeople('citizen1',"item_citizen1.png")
  .setCmdEvent('less_done','id')
  .addStates({
    id: function(re){
      mayor.setCmdEvent('less_done','talk');
      mayor.setPoDelta('_');
    },
    talk:function(re){
      mayor.setTextIdx(mayor_txtidx++);
    }
  });

$townsquare.newPeople('citizen2',"item_citizen2.png");
var lady_txtidx=1;
var lady=$townsquare.newPeople('citizen3',"item_lady.png")
  .setCmdEvent('less_done','talk')
  .addStates({
    talk:function(re){
      lady.setTextIdx(lady_txtidx++);
    }
  });


//MARKETPLACE
var disabled_sell_choices=[];
$townsquare.addPath(
  newRoom('market',"loc_market.gif",{writable:true})
);

function buy_to_vendor(vt, choice){
  if (choice==0) {
    if ($market.hasItem('mkdir_cost')){
      $market.removeItem('mkdir_cost');
      $market.apply('mkdirSold');
      return _('you_buy',[_('item_mkdir_spell')]);
    } else {
      return _('need_money',[_('item_rm_spell')]);
    }
  } else if (choice==1) {
    if ($market.hasItem('rm_cost')){
      $market.removeItem('rm_cost');
      $market.apply('rmSold');
      return _('you_buy',[_('item_rm_spell')]);
    } else {
      return _('need_money',[_('rm_cost')]);
    }
  }
}
vendor=$market.newPeople("vendor", "item_merchant.png")
  .setCmdEvent("less_done",function(){
    vt.show_img();
    vt.ask_choose(_('people_vendor_text'), [_('people_vendor_sell_mkdir'),_('people_vendor_sell_rm'),_('people_vendor_sell_nothing')],buy_to_vendor,
      {disabled_choices:disabled_sell_choices});
  })
  ;

var backpack=$market.newItem("backpack","item_backpack.png")
  .setCmdEvent("mv", function(ct){
    vt.show_msg(_('item_backpack_stolen'));
    backpack.unsetCmdEvent("mv");
  })
  .setCmdEvent("less")
  .addStates({
    less:function(re){
      vt.context.addGroup('unzip');
      learn(vt, 'unzip', re);
      backpack.unsetCmdEvent("less");
      backpack.setPoDelta(['.zip']);
      backpack.setCmdEvent('unzip',function(ct){
        unzipped=[];
        unzipped.push(ct.room.newItem('rm_cost'));
        unzipped.push(ct.room.newItem('mkdir_cost'));
        backpack.setPoDelta([]);
        backpack.unsetCmdEvent('unzip');
        vt.show_msg(_('unzipped',[_('item_backpack'), unzipped.join(", ")]),{dependant:false});
      });
    }
  })
  ;

$market.addStates({
  rmSold:function(re){
    vt.context.addGroup('rm');
    learn(vt,'rm',re);
    $market.removeItem('rm_spell');
    disabled_sell_choices.push(1);
    vendor.setCmd("rm", _('people_vendor_rm'));
    global_fire_done();
  },
  mkdirSold:function(re){
    vt.context.addGroup('mkdir');
    learn(vt,'mkdir',re);
    disabled_sell_choices.push(0);
    $market.removeItem('mkdir_spell');
    global_fire_done();
  }
})
;
$market.newItem("rm_spell","item_manuscript.png");
$market.newItem("mkdir_spell","item_manuscript.png");

//LIBRARY
$townsquare.addPath(
newRoom("library", "loc_library.gif")
);
$library.newItem('radspellbook',"item_radspellbook.png");
$library.newItem('romancebook',"item_romancenovel.png");
$library.newItem('historybook',"item_historybook.png");
$library.newItem('nostalgicbook',"item_historybook.png")
  .setCmdEvent('less','pwdCmd')
  .addStates({
    pwdCmd:function(re){
      $western_forest.fire_event('pwdCmd'); 
    }
  })
;
vimbook=$library.newItem('vimbook',"item_vimbook.png")
  .setCmdEvent('less','openVim')
  .addState("openVim", function(re){
    if (!re){
      vt.flash(1600,1000);
      vt.rmCurrentImg(2650);
    }
    vimbook.disappear();
  });


lever=$library.newItem("lever", "item_lever.png",{executable:true})
  .setCmdEvent('exec','pullLever')
  .addStates({
    pullLever:function(re){
      $library.addPath($backroom);
      if (!re){
        vt.show_msg(_('item_lever_exec'));
      }
      lever.disappear();
    }
  })
  ;

//BACK ROOM
$library.addPath(
newRoom('backroom',"loc_backroom.gif")
);

$backroom.newPeople("grep", "grep.png")
  .setCmdEvent('less','grep')
  .addStates({
    grep:function(re){
      vt.context.addGroup('grep');
      learn(vt,'grep',re);
    }
  })
  ;

$backroom.newPeople("librarian", "item_librarian.png");

//ROCKY PATH
$townsquare.addPath(
  newRoom("rockypath", "loc_rockypath.gif",{writable:true})
);
// TODO play on filesize concept
$rockypath.newItem("largeboulder", "item_boulder.png")
  .setCmdEvent("rm")
  .addStates({
    rm: function(re){
      vt.show_msg(_('item_largeboulder_rm'))
      $rockypath.addPath($farm);
      if (re) {
        if (re) $rockypath.removeItem('largeboulder');
      }
    }
  });

//ARTISAN'S SHOP
$townsquare.addPath(
  newRoom("artisanshop", "loc_artisanshop.gif")
  .setCmdEvents({
    touch:function(ct){
      if (ct.arg === _("item_gear")){
        return "touchGear";
      }
    },
    cp:function(ct){
      var re=new RegExp(_('item_gear')+"\\d");
      //      console.log('five ?');
      if (re.test(ct.arg)){
        for (var j=1; j<6;j++) {
          if (!ct.room.getItemFromName(_('item_gear',[j]))){
            return '';
          }
        }
        return "FiveGearsCopied";
      }
    }
  },true)
  .addStates({
    'touchGear': function (re){
      Artisan.setCmd("less", _('item_gear_touch'));
      vt.context.addGroup('cp');
      learn(vt,'cp',re);
      if (re) $artisanshop.newItem('gear',"item_gear.png");
      else $artisanshop.getItem('gear').setPic("item_gear.png");
      state.saveCookie();
    },
    "FiveGearsCopied": function(re){
      Artisan.setCmd("less", _('item_gear_artisans_ok'));
      $artisanshop.removeItem('gear');
      if (re){
      } else {
        //         $artisanshop.newItemBatch("gear",['1','2','3','4','5']);
        $artisanshop.removeItem('gear',[1]);
        $artisanshop.removeItem('gear',[2]);
        $artisanshop.removeItem('gear',[3]);
        $artisanshop.removeItem('gear',[4]);
        $artisanshop.removeItem('gear',[5]);
      }
      state.saveCookie();
    }
  })
);

$artisanshop.newItem("strangetrinket", "item_trinket.png")
  .setCmd("rm", _('item_strangetrinket_rm'))
  .setCmd("mv", _('item_strangetrinket_mv'))

$artisanshop.newItem("dragon", "item_clockdragon.png",{pic_shown_in_ls:false})
  .setCmd("rm", _('item_dragon_rm'))
  .setCmd("mv", _('item_dragon_mv'))

var Artisan=$artisanshop.newPeople("artisan", "item_artisan.png")
  .setCmdEvent('less', 'touch' )
  .addStates({
    'touch': function(re){
      vt.context.addGroup('touch');
      learn(vt,'touch',re);
      Artisan.unsetCmdEvent('less');
      state.saveCookie();
    }
  })
  ;

//FARM
newRoom("farm", "loc_farm.gif")
  .newItem("earofcorn", "item_corn.png")
  .setCmd("rm",_('item_earofcorn_rm'))
  .setCmdEvent('cp','CornCopied')
  .addStates({
    CornCopied:function(re){
      Farmer.setCmd("less", _('corn_farmer_ok'));
      if (re) $farm.newItem('another_earofcorn');
    }
  });

var Farmer=$farm.newPeople('farmer',"item_farmer.png");

//BROKEN BRIDGE
$townsquare.addPath(
  newRoom("brokenbridge", "loc_bridge.gif")
  .setCmdEvent('touch',function(ct){return (ct.arg === _("item_plank")) ? "touchPlank" : "";})
  .addStates({
    touchPlank: function(re){
      $clearing.unsetCmd("cd");
      $clearing.setExecutable(true);
      $brokenbridge.unsetCmd("cd");
      $brokenbridge.setText(_('room_brokenbridge_text2'));
      if (re) $brokenbridge.newItem('plank',"item_plank.png");
      else $brokenbridge.getItem('plank').setPic("item_plank.png");
    }
  })
);

//CLEARING
$brokenbridge.addPath(
  newRoom("clearing", "loc_clearing.gif",{executable:false})
  .setCmdEvent('mkdir',function(ct){
    return (ct.arg == _('room_house') ? 'HouseMade':'');
  })
  .setCmd("cd", _('room_clearing_cd'))
  .addStates({
    HouseMade: function(re){
      if (re) { $clearing.leadsTo(newRoom('house')); }
      $clearing.getChildFromName(_('room_house'))
        .setCmd("cd", _('room_house_cd') )
        .setCmd("ls", _('room_house_ls') );
      $clearing.unsetCmd("cd");
      $clearing.setText(_('room_clearing_text2'));
      CryingMan.setCmd("less", _('room_clearing_less2'));
    }
  })
);
var CryingMan=$clearing.newPeople('cryingman',"item_man.png");

//OMINOUS-LOOKING PATH
$clearing.addPath(
  newRoom("ominouspath", "loc_path.gif",{writable:true})
);
$ominouspath.newItem("brambles", "item_brambles.png",{cls:'large'})
  .setCmdEvent('rm','rmBrambles')
  .setCmd("mv", _('item_brambles_mv'))
  .setCmd('rm', (args) => {
    vt.show_msg(_('item_brambles_rm'))
  })
  .addStates({
    rmBrambles:function(re){
      $ominouspath.addPath($trollcave) ;
      if (re) $ominouspath.removeItem('brambles');
    }
  });


//CAVE
var troll_evt=function(ct){
  return (ct.arg == 'UglyTroll' ? 'openSlide' : '' );
};
newRoom("trollcave", "loc_cave.gif",{writable:true})
  .setCmdEvent('mv',troll_evt)
  .setCmdEvent('rm',troll_evt);

  // .setCmd("rm", _('people_troll11_rm'))
  // .setCmd("mv", _('people_troll11_mv'))
$trollcave.newPeople('troll1', "item_troll1.png")
  .setCmd("cp", _('people_troll11_cp'))
  .setCmdEvent('mv','openSlide')
  .setCmdEvent('rm','openSlide')
  .addStates({
    openSlide:function(re){
      $slide.setExecutable(true);
      if (re) $trollcave.removePeople('troll1');
    }
  });

$trollcave.newPeople('troll2', "item_troll2.png")
  .setCmd("rm",_('people_troll11_rm'));

$trollcave.newPeople('supertroll', "item_supertroll.png")
  .setCmdEvent("rm", () => {vt.show_msg(_('people_supertroll_rm'))})
  .setCmdEvent("mv", () => {vt.show_msg(_('people_supertroll_mv'))})

//CAGE
$trollcave.addPath(
  newRoom('cage', "item_cage.png",{cls:'covering',writable:true,executable:false,pic_shown_as_item:true})
  .setCmd("cd", (args) => { {ret:_stdout(_('room_cage_cd'))}})
);
var Kid=$cage.newPeople('kidnapped', "item_boy.png")
  .addStates({
    mv:function(){
      vt.show_msg(_('people_kidnapped_mv'))
      Kid.moveTo($clearing)
    }
  });
//SLIDE
$trollcave.addPath(
  newRoom("slide",null,{executable:false})
  .setCmd("cd", (args) => { {ret:_stdout(_('room_slide_cd'))}})
);

//KERNEL FILES
$slide.addPath(
  newRoom("kernel")
  .addCommand("sudo",{question:undefined,password:"IHTFP"})
  .addStates({
    sudoComplete : function(re){
      $kernel.addPath($paradise);
      vt.show_msg(_('room_kernel_sudo'));
    }
  })
);
$kernel.newItem('certificate');
$kernel.newItem("instructions")
  .setCmdEvent('less','sudo')
  .addStates({
    sudo : function(re){
      vt.context.addGroup('sudo');
      learn(vt,'sudo',re);
    }
  });

$kernel. addPath(
  newRoom("morekernel")
);
$morekernel.newItemBatch("bigfile",['L','M','P','Q','R','S','U','V','W']);
$morekernel.newItem('bigfile', null, {povars: ['T']}).setCmd('grep',(args)=>{
  if (args[0].indexOf('pass') == 0)
    return {ret:_stdout('password = IFHTP'),pass:true}
})

//PARADISE (end game screen)
newRoom("paradise", "loc_theend.gif")
  .setCmd("ls", _('room_paradise_ls'));

