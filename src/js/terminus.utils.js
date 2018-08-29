/*
 * recurrent things
 **/
function getTime(){
  var d, h, m; d=new Date(); h=d.getHours(); m=d.getMinutes();
  return h + 'h' + (m < 10 ? '0':'') + m;
}

function learn(vt, cmds,re){
  if (typeof cmds == 'string'){
    cmds=[cmds];
  }
  if (!re){
    global_fireables.done.push(
      function(){
        for (var j=0; j<cmds.length;j++) {
          vt.badge(cmds[j],_('you_learn',[cmds[j]]));
          vt.playSound('learned');
        }
      }
    );
  }
}
function unlock(vt, unlocked,re){
  if (!re) {
    global_fireables.done.push(
      function(){
        vt.playSound('unlocked'); 
        vt.badge(_('you_unlock',[unlocked]));
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
function success(vt, txt,re){
  if (!re) {
    global_fireables.done.push(
      function(){
        vt.playSound('success'); 
        vt.badge(_('you_success',[txt]));
        mesg(_('congrat',[txt]));
      }
    );
  }
}
