var minigame_intro={
  start:function (vt,bs,end){
    vt.show_msg([_('prelude_tuto'),
      function(){minigame_intro.game(vt,bs,end);}],{el:bs,direct:true});
  },
  drawPlatform:function(c,op,custom_matrix,bgstyle){
    var m=custom_matrix||op.grid.matrix,
      range=op.range;
    var x=op.grid.x,
      y=op.grid.y;
    var bl;
    if (bgstyle){c.setAttribute('style',c.getAttribute('style')+';'+bgstyle);}
    for (var j=0;j<m.length;j++){
      for (var i=0;i<m[j].length;i++){
        if (m[j][i]==1){
//          bl=addEl(c,'img',{'src':'./img/box.png','style':'z-index:99;position:absolute;height:'+y+'%;width:'+x+'%;left:'+(i*x)+'%;bottom:'+(j*y)+'%;'});
          bl=addEl(c,'div',{'style':'background:#FFF;z-index:99;position:absolute;height:'+y+'%;width:'+x+'%;left:'+(i*x)+'%;bottom:'+(j*y)+'%;'});
        } else if (m[j][i]==2){
          bl=addEl(c,'div',{'style':'z-index:99;position:absolute;background:rgba(33,33,33,.3);border:1px solid #fff;box-sizing:border-box;width:'+x+'%;height:'+y+'%;left:'+(i*x)+'%;bottom:'+(j*y)+'%;'});
        } else if (m[j][i]==3){
          bl=addEl(c,'img',{'src':'./img/boulder.png','style':'z-index:99;position:absolute;height:'+y+'%;left:'+(i*x)+'%;bottom:'+(j*y)+'%;'});
        } else if (m[j][i]==4){
          bl=addEl(c,'div',{'style':'background:#FFF;z-index:99;position:absolute;transform:rotateX(-75deg) skewX(15deg);transform-origin:0 100%;z-index:-1;border-radius:3%;border:2px solid white;z-index:-1;height:'+y+'%;width:'+x+'%;left:'+(i*x)+'%;bottom:'+(j*y)+'%;'});
        }

        // else {
        // bl=addEl(c,'div',{'style':'z-index:99;position:absolute;background:rgba(33,33,33,.3);border:1px solid #fff;box-sizing:border-box;width:'+x+'%;height:'+y+'%;left:'+(i*x)+'%;bottom:'+(j*y)+'%;'});
        //  }
      }
    }
  },
  gravity:function(){
    var t=this;t.falling_down=true;
    setTimeout(function(){
      if (!t.setOffsetDeltaY(-5)){
        t.falling_down=false;
        if (t.nextgroundevt){
           t.nextgroundevt();
           t.nextgroundevt=null;
        }
      }
    },100);
  },
  game:function(vt,bs,end){
    var frisk=new Pic('kid_profile.png');
    var robot=new Pic('computer_empty.png');
    var robot2=new Pic('computer_empty.png');
    var robot3=new Pic('computer_empty.png');
    var robot4=new Pic('computer_empty.png');
    var onload=function(){
      vt.scrl(1000);
    };
    var c = addEl(bs,'div', "img-container");
    c.setAttribute('style','height:420px;max-height:80vh');
    var robot_layer=robot.render(c,onload);
//    robot_layer.othercls="big";
    var robot_layer2=robot2.render(c,onload);
    var robot_layer3=robot3.render(c,onload);
    var robot_layer4=robot4.render(c,onload);
    var frisk_layer=frisk.render(c,onload);
    frisk_layer.pid=0;
    robot_layer.pid=1;
    robot_layer2.pid=2;
    robot_layer3.pid=3;
    robot_layer4.pid=4;
    var keydown=false;
    var enemy=2;
    var dammage=[0,0,0,0,0];
    var maxdammage=[3,3,1,2,5];
    var endfu=function(l,x,y){
      dammage[l.pid]++;
      if(dammage[l.pid]>=maxdammage[l.pid]){
        if (l.pid != frisk_layer.pid ){
          enemy--;
          monret.innerHtml=_('prelude_enemy_kill');
          l.pic.set('computer_overkill.png');
          var loo=0,inte=setInterval(function(){
            l.pic.setChild('kick','computer_overkill_blur.png')||l.pic.unsetChild('kick');
            l.update();
            if (loo++ > 10){
              clearInterval(inte); 
            }
          },200);
          l.pic.unsetChild('lock');
          l.update();
        } else {
          enemy=0;
        }
        if (enemy<2){
          music.play();
          if (enemy<=0){
            end();
          }
        }
      }
    };
    var collect_string="";
    bs.onkeydown = function (e) {
      var k=e.key;

      if (!keydown){
        //       console.log(k);
        keydown=true;
        if ( k === 'Tab') {
          revrse=(frisk_layer.reverseX?-1:1);
          setTimeout(function(){
            frisk.setChild('kick','kid_kick_part.png');
            frisk_layer.update();
          },100);
          setTimeout(function(){
            frisk.unsetChild('kick');
            frisk_layer.update();
          },1000);
          if (frisk_layer.collide(robot_layer)){
            snd.play('hit');
            monret.innerHtml=_('prelude_tab');
            robot_layer.setOffsetDeltaXStepped(revrse*20,revrse*1,100,endfu);
          }
          if (frisk_layer.collide(robot_layer2)){
            snd.play('hit');
            monret.innerHtml=_('prelude_tab');
            robot_layer2.setOffsetDeltaXStepped(revrse*40,revrse*2,100,endfu);
          }
          if (frisk_layer.collide(robot_layer3)){
            snd.play('hit');
            monret.innerHtml=_('prelude_tab');
            robot_layer3.setOffsetDeltaXStepped(revrse*80,revrse*3,100,endfu);
          }
          if (frisk_layer.collide(robot_layer4)){
            snd.play('hit');
            monret.innerHtml=_('prelude_tab');
            robot_layer4.setOffsetDeltaXStepped(revrse*160,revrse*4,100,endfu);
            if (enemy<2){music.play();}
          }
          overide(e);
        } else if ( k == 'Enter' ) {
          frisk.setChild('arm','kid_punch_part.png');
          frisk_layer.update();
          setTimeout(function(){
            frisk.unsetChild('arm');
            frisk_layer.update();
          },1000);
          if (frisk_layer.collide(robot_layer)){
            robot.setChild('lock','computer_content.png',{index:-1});
            snd.play('poweron');
            monret.innerHtml=_('prelude_enter');
            robot_layer.update();
          }
          if (frisk_layer.collide(robot_layer2)){
            robot2.setChild('lock','computer_content.png',{index:-1});
            monret.innerHtml=_('prelude_enter');
            snd.play('poweron');
            robot_layer2.update();
          }
          if (frisk_layer.collide(robot_layer3)){
            robot3.setChild('lock','computer_content.png',{index:-1});
            monret.innerHtml=_('prelude_enter');
            snd.play('poweron');
            robot_layer3.update();
          }
          if (frisk_layer.collide(robot_layer4)){
            robot4.setChild('lock','computer_content.png',{index:-1});
            monret.innerHtml=_('prelude_enter');
            snd.play('poweron');
            robot_layer4.update();
          }
          overide(e);
        } else if ( e.ctrlKey ) {
          if (k === 'c' || k === 'v' || k === 'x'|| k === 'y' || k === 'z'   ) { 
            overide(e);
          }
        } else if (k === 'PageUp' || k  === 'PageDown' ){
          window.focus();
          bs.blur();
        } 
        if ( k === 'ArrowUp') {
          overide(e);
          if (!frisk_layer.falling && !frisk_layer.falling_down) {
            frisk_layer.setOffsetDeltaYStepped(30,5,100);
            frisk_layer.reverseY=false;
          } else {
            frisk_layer.reverseY=true;
          }

        } else if ( k  === 'ArrowDown') {
          overide(e);
          frisk_layer.gravity_coef=frisk_layer.gravity_coef*(-1);
          frisk_layer.reverseY=true;frisk_layer.setOffsetDeltaY(0);
        }
        if ( k === 'ArrowLeft') {
          overide(e);
          if (!frisk_layer.reverseX){frisk.set('kid_face.png');}
          else {frisk.set('kid_profile.png');}
          frisk_layer.update();
          frisk_layer.reverseX=true;
          frisk_layer.setOffsetDeltaX(-2);
        } else if ( k  === 'ArrowRight') {
          overide(e);
          if (frisk_layer.reverseX){frisk.set('kid_face.png');}
          else {frisk.set('kid_profile.png');}
          frisk_layer.reverseX=false;
          frisk_layer.update();
          frisk_layer.setOffsetDeltaX(2);
        }
      } else {
        if (k.match('Arrow')) overide(e);
      }
      return !e.defaultPrevented;
    };
    var moninput=addEl(bs,'p');
    var monret=addEl(bs,'p');
    var parseCollectStr=function(){
      var ret=collect_string+" : ";
      if (collect_string=='ls'){
        robot_layer.setOffsetDeltaXStepped(50,5,100,endfu);
        ret+=_('prelude_success_cmd');
      } else if (collect_string=='cat'||collect_string=='less'){
        robot_layer2.setOffsetDeltaXStepped(50,5,100,endfu);
        ret+=_('prelude_success_cmd');
      } else if (collect_string=='cd'){
        robot_layer3.setOffsetDeltaXStepped(50,5,100,endfu);
        ret+=_('prelude_success_cmd');
      } else if (collect_string=='exit'){
        frisk_layer.setOffsetDeltaXStepped(50,-5,-100,endfu);
        ret+=_('prelude_success_cmd');
      } else if (collect_string=='talk'){
        frisk_layer.setOffsetDeltaXStepped(50,5,100,endfu);
        ret+=_('prelude_success_cmd');
      } else if (collect_string=='rm -rf *'){
        ret+="You finish the game! Yeah !"; 
      } else if (collect_string=='red'){
        frisk_layer.othercls='red';
        frisk_layer.update();
      } else if (collect_string=='hado'||collect_string=='hadoken'||collect_string=='hadouken'||collect_string=='kameha'||collect_string=='kamehameha'){
        ret+=_('prelude_wrong_game');
      } else {
        ret='';
      }
      monret.innerHTML=ret;
      collect_string='';
    }
    bs.onkeyup = function (e) {
      var k=e.key;
      keydown=false;
      if ( k === 'Tab' || k === 'Enter' ) {
        parseCollectStr();
      } else {
        if (k === 'Backspace') {
          collect_string=collect_string.slice(0,-1);
        } else if (k.length==1){
          collect_string+=k;
        }
        moninput.innerHTML=collect_string;
        if (bs.collecttimeout) clearTimeout(bs.collecttimeout);
        bs.collecttimeout=setTimeout(parseCollectStr,1000);
      }
      //    console.log(k);
    };
    frisk_layer.setOffsetProp({unit:['%','%'],prop:["left","bottom"],range:[[0,100],[0,100]]});
    frisk_layer.setPlatformGrid([
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,1,1,1,1,0,0,0]
    ].reverse());
    var op=frisk_layer.getOffsetProp();
    this.drawPlatform(c,op, [
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,4,4,4,4,0,0,0],
      [0,0,0,2,2,2,2,0,0,0]
    ].reverse(),
      'background:url(./img/grass.png) repeat-x bottom;'
    );
    frisk_layer.nextgroundevt=function(){
      music.play('battle',{loop:true});
    };
    frisk_layer.gravity=this.gravity;
    robot_layer.gravity=this.gravity;
    robot_layer.setOffsetProp(op);
    robot_layer2.gravity=this.gravity;
    robot_layer2.setOffsetProp(op);
    robot_layer3.gravity=this.gravity;
    robot_layer3.setOffsetProp(op);
    robot_layer4.gravity=this.gravity;
    robot_layer4.setOffsetProp(op);
    
    frisk_layer.setOffset([0,50]);
    robot_layer.setOffset([52,30]);
    robot_layer2.setOffset([32,30]);
    robot_layer3.setOffset([62,30]);
    robot_layer4.setOffset([42,30]);
  }
};
add_test(function(next){
  vt.wait_free(function(vt){
    vt.battlescene(minigame_intro.start);
  });
  vt.loop_waiting();
});
TESTING=true;
