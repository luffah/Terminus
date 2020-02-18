/*
 * recurrent things
 **/
function getTime(){
//  return new Date().toLocaleFormat('%Hh%M');
  var d=new Date();
  return d.getHours() + 'h' + d.getMinutes();
}

function learn(vt, cmds,re){
  if (typeof cmds == 'string'){
    cmds=[cmds];
  }
  if (!re){
    global_fireables.done.push(
      function(){
        for (var j=0; j<cmds.length;j++) {
          vt.badge(_('you_learn',[cmds[j]]),_('you_learn_desc',[cmds[j]]));
          vt.playSound('learned');
        }
      }
    );
  }
}
function unlock(vt, unlocked, re){
  if (!re) {
    global_fireables.done.push(
      function(){
        vt.playSound('unlocked'); 
        vt.badge(_('you_unlock',[unlocked]), _('you_unlock_desc', [unlocked]));
      }
    );
  }
}
function mesg(msg,re,opt){
  if (!re) {
    opt=opt||{};
    var fu= function(){
      setTimeout(function(){
        vt.show_msg('<div class="mesg">'+
            _('msg_from',[opt.user||'????',opt.tty||'???',getTime()])+
            "\n" + 
            msg +'</div>',
            {direct:true}
        );
      },opt.timeout||0);
    };
    if (opt.ondone){
      global_fireables.done.push(fu);
    } else {
     fu();
    }
  }
}
function ondone(fu){
global_fireables.done.push(fu);
}
function success(vt,txt, re){
  if (!re) {
    global_fireables.done.push(
      function(){
        vt.playSound('success'); 
        vt.badge(_(txt+'_success_title'), _(txt+'_success_text'));
        var m = txt+'_congrat_mesg';
        if (m in dialog){
          mesg(_(m));
        }
      }
    );
  }
}
