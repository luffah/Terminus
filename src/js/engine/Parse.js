
function _expandArgs(args,r){
  var newargs=[],room,lastcomponent,path,re;
//  console.log('_expandArgs',args,r);
  for (var i=0;i<args.length;i++){
//    console.log(args[i]);
    if (regexp_str.test(args[i])) {
      newargs.push(args[i].slice(1,args[i].length-1));
    }  else if(regexp_star.test(args[i])){
      roomp=r.pathToRoom(args[i]);

      room=roomp[0];
      lastcomponent=roomp[1];
      re=new RegExp(lastcomponent.replace(/\./g,'\\\.').replace(/\*/g,'.*'));
      if (room && lastcomponent){
        //        console.log(lastcomponent);
        path=roomp[2];
        var expanded=[];
        for (var j = 0; j < room.items.length; j++){
          if (re.test(room.items[j].toString())){
            expanded.push(path+(path.length?'/':'')+room.items[j].toString());
          }
        }
        newargs=newargs.concat(expanded.sort());
      } else {
        newargs.push(args[i]);
      }
    } else {
      newargs.push(args[i]);
    }
  }
  return newargs;
}
function _validArgs(cmd,args,r){
  if (cmd =='ls') {
    return true;
  } else {
    if (args.length == 1){
      if (['man','cd','mkdir','less','touch','unzip'].indexOf(cmd)>-1){
        return true;
      }
    }
    return false;
  }
}
function commonprefix(array) {
  //https://stackoverflow.com/questions/1916218/find-the-longest-common-starting-substring-in-a-set-of-strings/1917041#1917041
  var A= array.concat().sort(), 
    a1= A[0], a2= A[A.length-1], L= a1.length, i= 0;
  while(i<L && a1.charAt(i)=== a2.charAt(i)) i++;
  return a1.substring(0, i);
}
function _completeArgs(args,argidx,tocomplete,r, compl){ // return completion matches
  var search_room = tocomplete.substring(0,1) == "~" ? $home : r;
  tocomplete=tocomplete.replace(/\*/g,'.*');
  //Iterate through each room
  var new_room,
    substring_matches = [],
    cmd=args[0];
  var syntax=[ARGT.cmdname].concat(_getCommandSyntax(cmd));

  if (_argType(syntax,argidx,ARGT.cmdname)){
    var cmds=_getUserCommands();
//    tocomplete=args.shift();
    idx=0;
    for(var i = 0; i<cmds.length; i++){
      if(compl(cmds[i])){
        substring_matches.push(cmds[i]+((cmds[i]==tocomplete)?' ':''));//space is here to say : if only one found, then go to next arg
      }
    }
    return substring_matches;
  }
  if (_argType(syntax,argidx,ARGT.msgid)){
    //    if (cmd=='poe') {
    return Object.keys(dialog).filter(function(i){
      return i.match("^"+tocomplete);
    }).slice(0,20); 
  } 
  var path_rooms = tocomplete.split("/");
  if (_argType(syntax,argidx,ARGT.dir) && path_rooms.length == 1 && path_rooms[0].length === 0){
    substring_matches.push('..'); 
  }
  for (room_num=0;room_num<path_rooms.length;room_num++)
  {
    new_room = search_room.can_cd(path_rooms[room_num]);
    if(new_room){
      search_room = new_room;
      if (room_num === path_rooms.length -1){
        ret = [new_room.name + '/' ];
      }
    } else {
      //We've made it to the final room,
      // so we should look for things to complete our journey
      if(room_num == path_rooms.length-1){
        //Compare to this room's children
        if(_argType(syntax,argidx,ARGT.strictfile)||_argType(syntax,argidx,ARGT.file)||_argType(syntax,argidx,ARGT.dir)) {
          for(child_num = 0; child_num<search_room.children.length; child_num++){
            if(compl(search_room.children[child_num].name, path_rooms[room_num])){
              substring_matches.push(search_room.children[child_num].name + '/');
            }
          }
          //Compare to this room's items
          if(_argType(syntax,argidx,ARGT.strictfile)||_argType(syntax,argidx,ARGT.file)) {
            for(item_num = 0; item_num<search_room.items.length; item_num++){
              if(compl(search_room.items[item_num].name, path_rooms[room_num])){
                substring_matches.push(search_room.items[item_num].name);
              }
            }
          }
        }
      }
    }
  }
  return substring_matches;
}
function _getCommands(r){
  var ret=[],cmd,i;
  for (i=0;i<r.items.length;i++){
    if (r.items[i].executable){
      ret.push('./'+r.items[i].name);
    }
  }
  return ret.concat(_getUserCommands());
}

function psychologist(r, cmd, args){
  // TODO: match sentence structure
  //    if command structure  --> get a similar command
  //   
  //
  //    criterion : love, hate, question, negation, philosophie, existance, life, game reference
  //

  return _('cmd_not_found',[cmd,r.name]);
}

 // TODO: how to save filesystem structure
function _parse_exec(vt, arrs,superuser){
  var r=vt.getContext();
  var cmd = arrs[0];
  var ret = "";
  // var r=t;
  arrs.push(arrs.pop().replace(/\/$/,""));
//  console.log('_parse_exec',arrs,r);
  var args=_expandArgs(arrs.slice(1),r);
  // find the program to launch
  var cmdexec=null;
  if (cmd.match(/^(\.\/|\/)/)){//find a local program
    //      console.log('matched');
    var tr=r.traversee(cmd);
    var item=tr.item, r=tr.room;
    if (item && item.executable){
      cmdexec=function(args,t,vt){
        return item.exec(args,t,vt);
      };
    }
  }
  if (!cmdexec && _hasRightForCommand(cmd,r)){//find a builtin program
    cmdexec=_getCommandFunction(cmd);
  }
  // test command eligibility when no existant cmd 
  if ( !cmdexec) {
    if (cmd in r.cmd_text){
      r.fire_event(vt,cmd+'_cmd_text',args,0);
      ret=r.cmd_text[cmd];
    } else {
      r.fire_event(vt,'cmd_not_found',args,0);
      r.fire_event(vt,cmd+'_cmd_not_found',args,0);
      ret=cmd_done(vt,[[r,0]], psychologist(r,cmd,args),'cmd_not_found',args);
    }
    return ret;
  } 
  // asume there is a collection of password to unlock
  // if the collection is empty then the command is executed
  var passwordcallback=function(passok,cmdpass){
    var ret = "";
    if (passok) {
      var text_to_display = cmdexec(args,r,vt);
      if (text_to_display){
        ret=text_to_display;
      } else if (cmd in r.cmd_text){
        ret=r.cmd_text[cmd];
      }
    } else {
      ret=_('room_wrong_password');
    }
    return ret;
  };

  // construct the list of passwords to give
  var cmdpass=[];
  if (cmd in r.commands_lock){
    if (cmd.locked_inside) { // test option locked inside
      cmdpass.push(r.commands_lock[cmd]);
    }
  }
  var tgt,cur;
  for (var i=0;i<args.length;i++ ){
    tgt=r.traversee(args[i]);
    cur=tgt.room;
    //don't ask passwd for items OR if no room
    if (!cur || tgt.item) {continue;}
    if (i===0 && !_hasRightForCommand(cmd,cur)){
      if (cmd in cur.cmd_text){
        ret=cur.cmd_text[cmd];
      } else {
        ret = _('cmd_not_found',[cmd,cur.name]);
      }
      return ret;
    }
    if (cmd in cur.commands_lock){
      if(cmd === "sudo" && cur.hasOwnProperty('supass') && cur.supass){
        continue;
      }
      cmdpass.push(cur.commands_lock[cmd]);
    }
  }
  // ask passwords and exec 
  if (cmdpass.length > 0){
    vt.ask_password(cmdpass,passwordcallback);
  } else {
    return passwordcallback(true);
  }
}
