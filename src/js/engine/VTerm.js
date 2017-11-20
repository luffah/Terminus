
/* Terminal interface which solve completion problem */
var SAFE_BROKEN_TEXT=true;
function addspace(i){return i+' ';}
function overide(e){
  e.preventDefault();
  e.stopPropagation();
}
function VTerm(container_id, context){
  var t=this;
  /* non dom properties */
  t.context = context;
  t.charduration=10;
  t.charfactor={char:1,' ':8,' ':2,'!':10,'?':10,',':5,'.':8,"\t":2, "\n":10,'tag':10};
  t.charhtml={' ':'&nbsp;',"\n":'<br>',"\t":'&nbsp;&nbsp;'};
  t.imgs={};
  t.statkey={};
  t.history=[];
  t.disabled={};
  t.waiting_fus=[];
  t.histchecking=false;
  t.histindex=0;
  t.scrl_lock=false;
  t.cmdoutput=true;
  t.suggestion_selected=null;
  /* dom properties (view) */
  t.container = dom.Id(container_id);
  t.monitor = addEl(t.container,'div','monitor');
  // for accessibility
  t.ghost_monitor = prEl(document.body,'div','ghost-monitor');
  t.notifications=addEl(document.body,'div', 'notifications');
  t.last_notify=Date.now();
  addAttrs(t.ghost_monitor,{
    'role':'log',
    'aria-live':'polite',
    //    'aria-relevant':'additions removals'
  });
  t.inputdiv = addEl(addEl(t.container,'div','input-container'),'div','input-div');
  t.cmdline = addEl(t.inputdiv,'p','input');
  t.input = addEl(t.cmdline,'input',{size:80});
  var b=addEl(t.cmdline,'div','belt');
  addAttrs(t.cmdline,{
    'role':'log',
    'aria-live':'polite',
  });
  var k=addEl(b,'div','keys');
  t.suggestions= addEl(b,'div','suggest');
  addAttrs(t.suggestions,{
    'role':'log',
    'aria-live':'polite',
    'aria-relevant':'additions removals'
  });
  // buttons
  t.btn_clear=addBtn(k,'key','✗','Ctrl-U',function(e){
    t.set_line(''); t.show_suggestions(_getCommands(this.context).map(addspace)); });
  t.btn_tab=addBtn(k,'key','↹','Tab',function(e){t.make_suggestions();});
  t.btn_enter=addBtn(k,'key','↵','Enter',function(e){t.enterKey();});
  t.msg_idx=0;
  t.soundbank={};
  t.badge_pic=new Pic('badge.png');
  t.timeout={badge:3000,scrl:100,notification:4000};
  t.behave();
}
VTerm.prototype={
  /* API part */
  setContext: function(ctx){
    this.context=ctx;
//    this.show_suggestions(_getCommands(this.context).map(addspace));
  },
  getContext: function(){
    return this.context;
  },
  flash: function(timeout,timeoutdisappear){
    setTimeout(function(){
      document.body.className += ' flash';
      setTimeout(function(){
        document.body.className = document.body.className.replace(/[ ]*flash/,'');
      },timeoutdisappear);
    },timeout);
  },

  /// How to see the VTerm is busy : i don't know
  /// but i assume that if you check every .5 second
  /// and that you see there is no msg prompt during 1 second
  /// then this is not busy...
  /// Looping on an empty waiting loop (while true do skip)
  /// consume CPU, so i decided to stop waiting at 5 seconds of non busy state
  wait_free:function(fu){
     this.waiting_fus.push(fu);
  },
  run_waiting:function(){
    var fu=this.waiting_fus.shift();
    if (fu) fu(this);
  },
  loop_waiting:function(){
    var wcnt=0,t=this;
    if (!t.waiting_interval){
      t.waiting_interval=setInterval(function(){
        if (t.busy){
          wcnt=0;
        } else if ((wcnt>0) && (t.waiting_fus.length > 0)){
          t.run_waiting();
        } else {
          wcnt++;
          if (wcnt>10){
            clearInterval(t.waiting_interval);
          }
        }
      },500);
    }
  },
  /// 
  push_img: function(img,opt){
    opt=opt||{};
    if (img) {
      var idx=d(opt.index,-1);
      if (!this.imgs[idx]) { this.imgs[idx]=[]; }
      this.imgs[d(opt.index,-1)].push(img);
    }
    return this;
  },
  unset_img: function(){
    var t=this;
    if (t.imgs.length>0) {
      t.imgs.pop();
    }
  },
  show_img: function(opt){
    opt=opt||{};
    var t=this;
    var idx=d(opt.index,-1);
    var im;
    var imgs=t.imgs[idx];
    if (imgs && imgs.length>0) {
      var onload=function(){
        //        console.log('load');
        t.scrl(1000);
      };
      var c = addEl(t.monitor,'div', "img-container");
      while (im=imgs.shift()) {
          im.render(c,onload);
      }
    }
  },
  epic_img_enter: function(i, clss, scrl_timeout,callback){
    var t=this;
    t.scrl_lock=true;
    var c = addEl(t.monitor,'div', "img-container "+clss);
    pic=new Pic(i);
    pic.render(c,function(){
      c.className+=' loaded';
      setTimeout(function(){
        t.scrl_lock=false;
        t.scrl();
        if (def(callback)){
          callback(vt);
        }
      },scrl_timeout);
    });
  },
  clear:function(){
    this.monitor.innerHTML="";//clear screen
  },
  muteSound: function(){
    this.mute=true;
  },
  unmuteSound: function(){
    this.mute=false;
  },
  muteCommandResult: function(){
    this.cmdoutput=false;
  },
  unmuteCommandResult: function(){
    this.cmdoutput=true;
  },
  playSound : function(key){
    if (!this.mute){
      this.soundbank.play(key);
    }
  },
  /* Getter and setters */
  get_line:function(){
    return this.input.value.replace(/\s+/," ");
  },
  set_line:function(val){
    this.input.value = val;
  },
  get_cursor_pos:function(){
    return this.input.selectionStart;
  },
  set_cursor_pos:function(c){
    this.input.selectionStart=c;
  },
  /* UI part */
  // Scroll the window to the last element (bottom of page)
  scrl:function(timeout,retry){
    var t=this;
    var m=t.monitor;
    retry=d(retry,2);
    if ((m.parentNode.offsetTop + m.offsetTop + m.offsetHeight+t.inputdiv.offsetHeight)>window.innerHeight){
      if (!t.scrl_lock){
        if (!def(timeout)){
//          var c=t.container;
          window.scrollBy(0, window.innerHeight);
//          window.scrollTo(0, m.parentNode.offsetTop + m.offsetTop + m.offsetHeight+t.inputdiv.offsetHeight);
          return true;
        }
      }
      timeout=d(timeout,100);
      retry--;
      if (retry>0){
        setTimeout(function(){
          t.scrl(0,retry);
        },timeout);
      }
    }
   ///  ???? 
  // ---- --- - -- --- -- ---- - -- --- -- -
//(window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop) ought to give you the current scroll position in just about any browser.

//The three scrolling functions you'll want to concern yourself with are window.scroll(x,y), window.scrollBy(dx,dy), and window.scrollTo(x,y).
//As David mentioned you'll need the scroll position to know where you are and use the window.onscroll event to fire off this calculation.

//window.onload = function () { 
//  window.onscroll = function () { 
//    var doc = document.body, 
//    scrollPosition = doc.scrollTop,
//    pageSize = (doc.scrollHeight - doc.clientHeight),
//    percentageScrolled = Math.floor((scrollPosition / pageSize) * 100); 
//
//     if (percentageScrolled >= 50){ // if the percentage is >= 50, scroll to top
//       window.scrollTo(0,0); 
//     } 
//   }; 
//};

  // ---- --- - -- --- -- ---- - -- --- -- -
  },
  disable_input:function(){//disable can act as a mutex, if a widget don't get true then it shouldn't enable input
    var t=this;
    if (!t.disabled.input){
      t.disabled.input=true;
      t.btn_clear.setAttribute('disabled','');
      t.btn_tab.setAttribute('disabled','');
      t.inputdiv.removeChild(t.cmdline);
      return true;
    }
    return false;
  },
  enable_input:function(){
    var t=this;
    if (t.disabled.input){
      t.disabled.input=false;
      t.inputdiv.prepend(t.cmdline);
      t.btn_clear.removeAttribute('disabled');
      t.btn_tab.removeAttribute('disabled');
      t.enterKey=t.enter;
      t.input.focus();
      return true;
    }
    return false;
  },
  show_previous_prompt: function (txt){
    addEl(this.monitor,'p','input').innerText = txt;
  },
  _show_chars: function (msgidx,msg,txttab,dependant,safe,cb,txt,curvoice,cnt,opt){
    l=txttab.shift();
    var t=this;
    t.busy=true;
    if (def(l)){
      var timeout;
      if (l == "<" ){
        var tag="<";
        while (def(l) && (l != ">")){
          l=txttab.shift();
          tag+=l;
        }
        var tagtype=tag.replace(/<([^ ]*).*>/,'$1');
        if (tagtype == 'img') {
          msg.innerHTML += tag ;
          t.playSound('tag');
          timeout = t.charfactor[l];
        } else if (tagtype == 'voice' ) {
          curvoice=tag.replace(/<([^ ]*)[ ]*([^ ]*)\/>/,'$2');
//          console.log('change voice to '+curvoice);
        } else { 
          var tagend="";
          l=txttab.shift();
          while (def(l) && (l != ">")){
            tagend+=l;
            l=txttab.shift();
          }
          msg.innerHTML += tag+tagend ;
        }
        t.scrl();
      } else if (t.charfactor.hasOwnProperty(l)){
        msg.innerHTML += (t.charhtml[l]?t.charhtml[l]:l);
        t.playSound(l);
        timeout = t.charfactor[l];
        t.scrl();
      } else {
        msg.innerHTML += l;
        if (t.charfactor.char > 0 && cnt%3 == 1){
          t.playSound(curvoice);
        }
        timeout = t.charfactor.char;
      }
      if (!dependant || t.msg_idx==msgidx){
        setTimeout(function(){
          t._show_chars(msgidx,msg,txttab,dependant,safe,cb,txt,curvoice,++cnt,opt);
        },timeout*t.charduration);
      } else {
        if (SAFE_BROKEN_TEXT||safe) {
          msg.innerHTML=txt;
          t.scrl();
        }
        t.playSound('brokentext');
        if (cb) {cb();}
        if (opt.cb) {opt.cb();}
        t.busy=false;
       } 
    } else {
      t.playSound('endoftext');
      if (cb) {cb();}
      if (opt.cb) {opt.cb();}
      t.busy=false;
    }
  },
  rmCurrentImg: function(timeout){
    var t=this;
    setTimeout(function(){
      var y=t.current_msg.getElementsByClassName("img-container"); 
      var i;
      for (i = 0; i < y.length; i++) {
        msg.removeChild(y[i]);
      } 
    },timeout);
  },
  show_loading_element_in_msg: function (list,opt){
    var t=this;
    opt=opt||{};
    var containingel=d(opt.container,t.monitor);
    var innerEl;
    if (opt.el){
      innerEl=opt.el;
    } else {
      innerEl=addEl(containingel,'div','inmsg');
    }
    var period=d(opt.period,100);
//    var duration=d(opt.duration,period*list.length);
    var duration=opt.duration;
    var finalvalue=opt.finalvalue;
    var cb=opt.callback;
    var i=0;
    var id=t.msg_idx;
    var loop=setInterval(function(){
      if (t.msg_idx!=id){
        clearInterval(loop);
        if (finalvalue){
          innerEl.innerHTML=finalvalue;
          t.ghostel.innerHTML+=' '+finalvalue+' ';
        }
        if (cb){
          cb();
        }
      } else {
        innerEl.innerHTML=list[i%list.length];
        i++;
      }
    },period);
    if (duration){
      setTimeout(function(){
      if (id==t.msg_idx){
        t.msg_idx++;
      }
      },duration);
    }
    return this;
  },
  show_msg: function (msg,opt){
    if (def(msg)){
      opt=opt||{};
      var cb;
      var t=this;
      t.busy=true;t.loop_waiting();
      if (typeof msg != 'string'){
        cb=msg[1];
        msg=msg[0];
      }
      var el=d(opt.el,t.monitor);
      var dependant=d(opt.dependant,true);
      var safe=d(opt.safe,false);
      var direct=d(opt.direct,false);
      t.ghostel=addEl(t.ghost_monitor,'p');
      t.current_msg=addEl(el,'p','msg');
      if (msg.nodeType == 1){
        t.current_msg.appendChild(msg);
        t.ghostel.innerHTML=msg.outerHTML.replace(/<div class='inmsg'.*><\/div>/,'');
        if (cb) {cb();}
        if (opt.cb) {opt.cb();}
        t.busy=false;
      } else {
        txt=msg.toString();//ensure in case we have an object
        txt=txt.replace(/(#[^#]+#)/g,'<i class="hashtag"> $1 </i>');
        txttab=txt.split('');
        t.msg_idx++;
        txt=txt.replace(/\t/g,"&nbsp;&nbsp;").replace(/\n/g,"<br>").replace(/ /g,"&nbsp;");
        t.ghostel.innerHTML=txt.replace(/<div class='inmsg'.*><\/div>/,'').replace(/(<br>)/g,"<&nbsp;><br>").replace(/[«»]/g,'"').replace(/(\.\.\.)/g,'<br>');
        if (direct){
          t.current_msg.innerHTML=txt;
          if (cb) {cb();}
          if (opt.cb) {opt.cb();}
          t.busy=false;
          t.scrl();
        } else { // progressive 
          t._show_chars(t.msg_idx,t.current_msg,txttab,dependant,safe,cb,txt,'char',1,opt);
        }  
      }
    }
    return this;
  },
  /* Suggestion part */
  make_suggestions: function (tabidx,autocomplete){
    var ret=true;
    var t=this;
    tabidx=d(tabidx,-1);
    autocomplete=d(autocomplete,true);
    t.suggestions.innerHTML = '';
    var l=t.get_line(),pos=t.input.selectionStart;
    var hlidxs=[];
    args=l.split(' ');
    t.suggestion_selected=null;
    if (args.length > 0) {
      var offset=0,idx;
      for(idx=0;idx<args.length;idx++){
        offset+=args[idx].length+1;
        if (offset>pos) break;
      }
      var tocomplete=args[idx];
      var match=[];
//      console.log('suggestions',ac,l,args);
      // which word to guess
      if (tocomplete && idx>0) { // at least 1 arg
        match=_completeArgs(args,idx,tocomplete,t.context);
      } else if (args[0].length>0){ 
        if (_hasRightForCommand(args[0],user.groups)) { // propose argument
          match=_completeArgs(args,idx,tocomplete,t.context);
        } else { // propose command completion
          var cmds=_getCommands(t.context);
          idx=0;
          for(var i = 0; i<cmds.length; i++){
            if(cmds[i].match("^"+tocomplete)){
                match.push(cmds[i]);
            }
          }
        }
      } else { // propose commands
        tocomplete="";
        match=_getCommands(t.context).map(addspace);
      }
      console.log(match);
      // find solutions
      if (match.length === 0){
        t.set_line(l+'?');
        setTimeout(function(){t.set_line(l+'??');},100);
        setTimeout(function(){t.set_line(l);},200);
      } else if (match.length == 1 ){
        if (autocomplete) {
          var lb=tocomplete.split('/');
          lb[lb.length-1]=match[0];
          args.splice(idx,1,lb.join('/')); //insert value at idx
          t.set_line(args.join(" ").replace('././','./'));//regex workaround
        } else {
          if (match[0] == tocomplete) {
            t.set_line(l+' ');
          }
          t.show_suggestions(match);
        }
      } else {
        var lcp=commonprefix(match);
        if (match.indexOf(lcp)>-1){
          t.set_line(l+' ');
        } else if (tabidx>-1){
          if (tabidx < match.length) {
//          t.set_line(match[idx]+' ');
          hlidxs[tabidx]='select';
            t.suggestion_selected=match[tabidx];
          } else {
                ret=false;
          }
        } 
        if (lcp.length > 0 && autocomplete){
          var lb=tocomplete.split('/');
          lb[lb.length-1]=lcp;
          args.splice(idx,1,lb.join('/'));
          t.set_line(args.join(" "));
        }
        t.show_suggestions(match,hlidxs);
      }
    }
    return ret;
  },
  show_suggestions: function (list,highlights){
    highlights=highlights||[];
    this.suggestions.innerHTML = '<div class="visually-hidden">'+_('Suggestions')+'</div>';
    for (var i=0;i<list.length; i++){
      this.show_suggestion(list[i],highlights[i]);
    }
  },
  show_suggestion: function (txt,hlcls){
    var t=this;
    t.histindex=0;
    addBtn(t.suggestions,hlcls,txt.replace(/(#[^#]+#)/g,'<i class="hashtag"> $1 </i>'),txt,function (e){
      var l=t.get_line();
      var sp=l.split(" ");
      // replace word by complete suggestion
      var last=sp.pop();
      sp.push('');
      var newl=sp.join(' ')+txt;
      // set the line content and try to nxec
      t.set_line(newl);
      if (t.argsValid(newl.replace(/\s+$/,"").split(" "))){
        t.enter();
      } else {
        t.make_suggestions(-1,false);
      }
    });
    t.scrl();
  },
  hide_suggestions: function (){
    this.suggestions.innerHTML = '';
  },
  /* */
  argsValid: function(args){
    return _validArgs(args.shift(),args,this.context);
  },
  enter: function(){
    // Enter -> exec command
    var t=this;
    t.playSound('enter');
    var l=t.get_line().replace(/\s+$/,"");
    if (l.length>0){
      var pr=t.input;
      var mon=t.monitor;
      t.monitor = addEl(mon,'div','screen');
      t.histindex=0;
      t.show_previous_prompt(pr.value);
      t.history.push(pr.value);
      var args=l.split(' ');
      var echo=_parse_exec(t, args);
      if (def(echo)){
        if (echo.isReturnSequence){
          var supercb=[];
          for (var i=0;i<echo.length();i++){
             supercb.push(function(){
               t.show_img({index:echo.getIdx()});
               t.show_msg(echo.next(),{cb:supercb.shift()});
             });
          }
          supercb.shift()();
        } else {
          t.show_img();
          if (t.cmdoutput) {
            t.show_msg(echo);
          }
        }
t.set_line('');
t.hide_suggestions();
//t.show_suggestions(_getCommands(t.context).map(addspace));
t.monitor = mon;
      }
    }
  },
  enterKey : this.enter,
/*****************/
/** Prompt behavior part **/
/*****************/
  behave: function(){
    this.global_behavior();
    this.input_behavior();
  },
  global_behavior: function (){
    window.onbeforeunload = function(e) {
      return 'Quit the game ?';
    };
  },
  _cmdline_key:function(){
  

  },
  input_behavior: function (){
    // behavior 
    var t=this;
    var pr=t.input;

    dom.body.onkeydown = function (e) {
      e = e || window.event;//Get event
      if(def(t.battle_scene)){
        t.battle_scene.onkeydown(e);
      } else if(def(t.choose_input)||def(t.password_input)) {
        e.preventDefault();
      } else {
        var k=e.key;
        if (k === 'ArrowRight' || k  === 'ArrowLeft' || k === 'ArrowUp' || k  === 'ArrowDown') {
          if (e.shiftKey){
            e.preventDefault();
          }
        } else {
          var focused = dom.activeElement;
          if ( !focused || focused != pr) {
            pr.focus();t.scrl();
          }
          pr.onkeydown(e);
        }
      }
    };
    dom.body.onkeyup = function (e) {
      e = e || window.event;//Get event
      if(def(t.battle_scene)){
        t.battle_scene.onkeyup(e);
      } else if(def(t.choose_input)){
        t._choose_key(e.key,e);
      } else if(def(t.password_input)) {
        t._password_key(e.key,e);
      } else {
        var k=e.key;
        if (k === 'ArrowRight' || k  === 'ArrowLeft' || k === 'ArrowUp' || k  === 'ArrowDown') {
          if (e.shiftKey){
            e.preventDefault();
          }
        } else {
          var focused = dom.activeElement;
          if ( !focused || focused != pr) {
            pr.focus();t.scrl();
          }
          pr.onkeyup(e);
        }
      }
    };
    var lastkey=[null,0];
    pr.onkeydown = function (e) {
      var k=e.key;
      if ( k === 'Tab' || k == 'Enter' ) {
        overide(e);
      } else if ( e.ctrlKey ) {
        if (k === 'c' || k === 'v' || k === 'x'|| k === 'y' || k === 'z'   ) { 
          overide(e);
        }
      } else if (k === 'PageUp' || k  === 'PageDown' ){
        window.focus();
        pr.blur();
      }
      if ( k === 'ArrowUp' || k  === 'ArrowDown') {
        overide(e);
      }
      return !e.defaultPrevented;
    };
    pr.onkeyup = function (e) {
      var k=e.key;
      vt.statkey[k]=(vt.statkey[k]||0)+1;
      if (lastkey[0]==k) {lastkey[1]++;} else {lastkey[1]=0;}
      lastkey[0]=k;
      var echo="";
      t.hide_suggestions();
      if (k === 'Enter') {
        overide(e);
        if (t.suggestion_selected){
          t.input.value+=t.suggestion_selected;
          t.suggestion_selected=0;
          t.make_suggestions();
          lastkey[0]='Tab';
        } else {
          t.enter();
        }
        t.scrl();
      } else if (k === 'Tab' && !(e.ctrlKey || e.altKey)) {
        overide(e);
        if (!t.make_suggestions(lastkey[1]-1)) lastkey[1]=0;
        t.scrl();
      } else if (e.ctrlKey){
        if (k === 'c' ) { // CTRL+C - clear
          overide(e);
          t.show_previous_prompt(t.get_line() + '^C');
          t.msg_idx++;
          t.set_line('');
        } else if (k === 'u') { // CTRL+U - clear line
          overide(e);
          t.set_line('');
//        } else if (  k === 'v' || k === 'x' || k === 'y' || k === 'z'  ) {
        } else if (  k === 'v' || k === 'x') {
          // replace CTRL + W - remove last component
          overide(e);
          var line=t.get_line();
          line=line.replace(/\/$/,"");
          var lineparts=line.split(' ');
          var lastarg=lineparts.pop().split('/');
          lastarg.pop();
          if (lastarg.length > 1) {
            lastarg.push('');
          }
          lineparts.push(lastarg.join('/'));
          t.set_line(lineparts.join(' '));
        }
      } else if (k === 'PageUp' || k  === 'PageDown') {
        window.focus();
        // Remove focus from any focused element
        pr.blur();
      } else if (k  === 'ArrowDown') {//down
        if (t.histindex>0){
          t.histindex--;
          t.set_line(t.history[t.history.length-1-t.histindex]);
        } 
      } else if ( k === 'ArrowUp') {//up
        //        console.log(t.histindex, t.history);
        if (t.histindex < t.history.length){
          var prev=t.history[t.history.length-1-t.histindex];
          if (t.histindex===0){
            var txt=t.get_line();
            if (txt.length>0 && txt !== prev ){
              t.history.push(txt);
            }
          }
          t.set_line(prev);
          t.histindex++;
        }
      } else {

      }
//      console.log(e);
      return !e.defaultPrevented;
    };
  },
/** Badge rewards **/
  badge:function(title,text){
    var t=this;
    var badge=addEl(t.notifications,'div','badge');
    var now=Date.now();
    var diff=t.last_notify-now;
    var uptimeout=0;
    if (diff > 0){
      uptimeout=diff;
    } 
    var disappeartimeout=uptimeout+(t.timeout.badge/2);
    var downtimeout=uptimeout+t.timeout.badge;
    setTimeout(function(){
      t.notifications.removeChild(badge);
    },downtimeout);
    setTimeout(function(){
      badge.className+=' disappear';
    },disappeartimeout);
    setTimeout(function(){
      t.badge_pic.render(badge);
      addEl(badge,'span','badge-title').innerHTML=title;
      addEl(badge,'p','badge-desc').innerText=text;
    },uptimeout);
    t.last_notify=now+downtimeout;
  },
  notification:function(text){
    var t=this;
    var notification=addEl(t.notifications,'div','notification');
    var now=Date.now();
    var diff=t.last_notify-now;
    var uptimeout=0;
    if (diff > 0){
      uptimeout=diff;
    } 
    var disappeartimeout=uptimeout+(t.timeout.notification/2);
    var downtimeout=uptimeout+t.timeout.notification;
    setTimeout(function(){
      t.notifications.removeChild(notification);
    },downtimeout);
    setTimeout(function(){
      notification.className+=' disappear';
    },disappeartimeout);
    setTimeout(function(){
      addEl(notification,'p').innerHTML=text;
    },uptimeout);
    t.last_notify=now+downtimeout;
  },
/** Choice prompt **/
  ask_choose:function(question,choices,callback,opts){
    var t=this;
    var choices_btn=[];
    var curidx=0;
    opts=d(opts,{});
    disabled_choices=d(opts.disabled_choices,[]);
    direct=d(opts.direct,false);
    console.log(opts.disabled_choices);
    while (disabled_choices.indexOf(curidx)>-1){
      curidx++;
    } 
    var choicebox = addEl(t.monitor,'div','choicebox');
    t.show_msg(question,{direct:direct,el:choicebox,dependant:false});
   
    t.set_line('');
    t.choose_input = addEl(choicebox,'fieldset','choices');
    var reenable=t.disable_input();
    
    var click=function(e){
      var i=e.target.getAttribute('idx');
      addAttrs(choices_btn[curidx],{checked:''});
      addAttrs(choices_btn[i],{checked:'checked'});
      curidx=i;
      return t.enterKey();
    };
    var onkeydown=function(e){
      t._choose_key(e.key,e);
    };
    t.enterKey=function(e){
      t.playSound('choiceselect');
      t.choose_input.value=choices[curidx];
      t.show_msg(choices[curidx],{el:choicebox,dependant:false});
      choicebox.removeChild(t.choose_input);
      t.choose_input = undefined;
      if (reenable){ t.enable_input(); }
      t.show_msg(callback(t, curidx));
      
    };
    t._choose_key=function(k,e){
//      console.log(k);
      if (k=='ArrowDown'||k=='ArrowUp' || k == 'Tab' ){
        t.playSound('choicemove');
        choices_btn[curidx].removeAttribute('checked');
        if (k=='ArrowDown'||(!e.shiftKey && k=='Tab')){
          curidx=((++curidx)%choices_btn.length);
          while (disabled_choices.indexOf(curidx)>-1){
            curidx=((++curidx)%choices_btn.length);
          } 
        } else if (k=='ArrowUp'||(e.shiftKey && k=='Tab')){
          curidx=(--curidx>=0?curidx:(choices_btn.length-1));
          while (disabled_choices.indexOf(curidx)>-1){
            curidx=(--curidx>=0?curidx:(choices_btn.length-1));
          } 
        }
        addAttrs(choices_btn[curidx],{checked:'checked'});
        choices_btn[curidx].focus();
        t.ghostel.innerHTML=choices[curidx];
      } else if (k=='Enter') {
        t.enterKey();
      }
      e.preventDefault(); 
    };

    for (var i=0;i<choices.length;i++){
      if (disabled_choices.indexOf(i)==-1){ 
        cho=addEl(t.choose_input,'div','choice');
        choices[i]=choices[i];
        choices_btn.push(
          addEl(cho,'input',{
            type:'radio',
            name:'choose',
            idx:i,id:'radio'+i
          })
        );

        addAttrs(choices_btn[i],{
          'role':'log',
          'aria-live':'polite',
          'aria-relevant':'all'
        });
        choices_btn[i].onclick=click;
        choices_btn[i].onkeydown=onkeydown;
        addEl(cho,'span','selectpointer');
        addEl(cho,'label',{
          for:'radio'+i
        }).innerHTML=choices[i].replace(/(#[^#]+#)/g,'<i class="hashtag"> $1 </i>');
      } else {
        choices_btn.push(null);
      }
    }
      t.choose_input.onkeydown=onkeydown; 
    addAttrs(t.choose_input,{value:choices[curidx]});
    addAttrs(choices_btn[curidx],{checked:'checked'});
//    choices_btn[0].focus();
    t.scrl();
  }, 

/** Question prompt **/
  battlescene: function(fu,cb){
    var t = this;
    t.set_line('');
    var scont = t.monitor;
//    var scont = document.body;
    var cont = addEl(scont,'div','battlescene-container');
    t.battle_scene = addEl(cont,'div','battlescene');
    t.disable_input();
    var end_battle= function(){
      t.battle_scene.setAttribute('disabled',true);
      scont.removeChild(cont);
      t.battle_scene = undefined;
      if (cb) cb();
    };
    ///
    t.enterKey=function(){ console.log('Enter Pressed but Battle Mode');};
    return fu(vt,t.battle_scene,end_battle);
  },
/** Question prompt **/
  ask: function(question,callback,args){
    var t = this;
    t.set_line('');
    var choicebox = addEl(t.monitor,'div','choicebox');
    t.show_msg(question,{el:choicebox,dependant:false});
   
    if (args.multiline){
      t.answer_input=addEl(choicebox,'textarea',{cols:78});
    } else {
      t.answer_input=addEl(choicebox,'input',{size:78});
    }
    if (args.value){
      t.answer_input.value=args.value;
    }
    if (args.placeholder){
      t.answer_input.placeholder=args.placeholder;
    }
    t.answer_input.focus();
    t.answer_input.onkeyup=function(e){
      if (e.key === 'Enter') {
        if (e.ctrlKey || !args.multiline) { // ENTER
          t.enterKey();
          e.preventDefault();
          t.scrl();
        } else { // line return
          var strt=t.answer_input.selectionStart;
          var bef=t.answer_input.value.substr(0,strt),aft=t.answer_input.value.substr(strt);
          t.answer_input.value=bef+"\n"+aft;
          t.answer_input.selectionStart=strt+1;
          t.answer_input.selectionEnd=strt+1;
        }
      }
    };
    t.disable_input();
   
    var end_answer= function(){
      t.answer_input.setAttribute('disabled',true);
      t.answer_input = undefined;
      t.enable_input();
    };
    ///
    t.enterKey=function(){
      t.playSound('choiceselect');
      var ret = t.answer_input.value;
      end_answer();
      t.show_msg(callback(ret));
    };
  },
/** Password prompt **/
  _begin_password: function(){
    var t = this;
    t.set_line('');
    t._cur_box = addEl(t.monitor,'div','choicebox');
    t._div =addEl(t.inputdiv,'div',{class:'passinput'});
    t.password_input =addEl(t._div,'input',{size:20});
    

    t.password_input.focus();
    t.password_input.onkeyup=function(e){
      var k=e.key;
      if (k === 'Enter') { // ENTER
        t.enterKey();
        e.preventDefault();
        t.scrl();
      }
    };
    t.disable_input();
  },
  _end_password: function(){
    var t = this;
    t.inputdiv.removeChild(t._div);
    t.password_input = undefined;
    t._div = undefined;
    t.enable_input();
  },
  _password_key:function(k,e){
  //nothing
  },
  _ask_password_rec:function(cmdpass,callback){
    var t=this;
    if (cmdpass.length > 0){
      var p=cmdpass.shift();
      var question=d(p.question,_('ask_password'));
      t.show_msg( question,{el:t._cur_box});
      t.enterKey=function(){
        t.playSound('choiceselect');
        var ret = t.password_input.value;
        t.password_input.value="";
        if (p.password === ret){
          if (p.passok){
            t.show_msg(p.passok,{el:t._cur_box});
          }
          t._ask_password_rec(cmdpass,callback); 
        } else {
          if (p.passko){
            t.show_msg(p.passko,{el:t._cur_box});
          }
          t.show_msg(callback(false,cmdpass),{el:t._cur_box});
          t._end_password();
        }
      };
      t.scrl();
    } else {
      t.show_msg(callback(true,cmdpass));
      t._end_password();
    }
  }, 
  ask_password: function(cmdpass,callback){
    this._begin_password();
    this._ask_password_rec(cmdpass,callback);
  },
  auto_shuffle_input_msg: function(msg,fromcomplexicity,tocomplexicity,stepcomplexity,period,duration,incstep){
    var t=this;
    var id=t.msg_idx;
    if (t.input_operation_interval){
      clearInterval(t.input_operation_interval);
    }
    var inccnt=0;
    var tmpc=fromcomplexicity;
    var sens=(tocomplexicity>fromcomplexicity?1:-1);
    var limit=tocomplexicity*sens;
    var step=(tocomplexicity-fromcomplexicity)/stepcomplexity;
    t.input_operation_interval=setInterval(function(){
      if (t.msg_idx!=id){
        clearInterval(t.input_operation_interval);
        t.set_line('');
      } else {
        if (((tmpc*sens)<limit) && ((inccnt%incstep)==0)){
          tmpc=tmpc+step;
        }
        t.shuffle_input_msg(msg,tmpc);
        inccnt++;
      }
    },period);
    if (duration){
      setTimeout(function(){
      if (id==t.msg_idx){
        t.msg_idx++;
      }
      },duration);
    }
  },
  auto_shuffle_input: function(minsize,maxsize,period,duration,incstep){
    var t=this;
    var id=t.msg_idx;
    if (t.input_operation_interval){
      clearInterval(t.input_operation_interval);
    }
    var inccnt=0;
    var tmpsize=minsize;
    t.input_operation_interval=setInterval(function(){
      if (t.msg_idx!=id){
        clearInterval(t.input_operation_interval);
        t.set_line('');
      } else {
        if (incstep){
          if ((inccnt%incstep)==0){
            tmpsize++;
          }
          t.shuffle_input(tmpsize,null);
          inccnt++;
        } else {
          t.shuffle_input(minsize,maxsize);
        }
      }
    },period);
    if (duration){
      setTimeout(function(){
      if (id==t.msg_idx){
        t.msg_idx++;
      }
      },duration);
    }
  },
  shuffle_input: function(minsize,maxsize){
    var l=minsize+(maxsize?Math.round(Math.random()*(maxsize-minsize)):0);
    this.set_line(randomStr(l));
  },
  shuffle_input_msg: function(msg,complexicity){
    this.set_line(shuffleStr(msg,complexicity));
  }
};



