var ARGT={dir:[0],file:[1],opt:[2],instr:[3],var:[4],strictfile:[5],cmdname:[6],filename:[7],filenew:[8],dirnew:[9],pattern:[10],msgid:[12]};

function Command(name,syntax,fu){
  this.fu=fu;
  this.syntax=syntax;//example : cmd dir [-d|-e] (undo|redo) -> [ARGT.dir(),ARGT.opt.concat(['-d','e']),ARGT.instr.concat['undo','redo']],
  this.group=name;
  this.preargs=[];// default arguments (for aliases)
}

var global_commands_fu={};
function _hasRightForCommand(cmd,r){
  return (global_commands_fu[cmd]?(user.groups.indexOf(global_commands_fu[cmd].group) > -1):false) ;
}
function _getUserCommands(){
  return Object.keys(global_commands_fu).filter(_hasRightForCommand);
}
function _argType(syntax,argnum,argtyp){
  return argtyp[0]===syntax[argnum][0];
}
function _getCommandFunction(cmd){
  return global_commands_fu[cmd].fu;
}
function _getCommandSyntax(cmd){
  return global_commands_fu[cmd].syntax;
}
function _defCommand(cmd,syntax,fu){
  global_commands_fu[cmd]=new Command(cmd,syntax,fu);
}
function _setCommandGroup(group,commands){
  for (var cmd in global_commands_fu){
    if (commands.indexOf(cmd) > -1){
      global_commands_fu[cmd].group=group;
    } else if (global_commands_fu[cmd].group==group) {
      global_commands_fu[cmd].group=cmd;
    }
  }
}
function _lnCommand(cmd,cmdb){
  var c=global_commands_fu[cmdb];
  _defCommand(cmd,c.syntax,c.fu);
}

function _aliasCommand(cmd,cmdb,args){
  if (isStr(cmd)){
    c=global_commands_fu[cmdb].fu;
  } else {
    c=cmdb;
  }
  _defCommand(cmd,[ARGT.filenew],c);
  if (args.length>0){
    global_commands_fu[cmd].preargs=args;
  }
}

var global_fireables={done:[]};
function global_fire(categ){
  if (global_fireables[categ]){
    while (fun=global_fireables[categ].shift()){
      fun();
    }
  }
}
function global_fire_done(){global_fire('done');}

function cmd_done(vt, fireables, ret, cmd, args){
  // fire events *_done when ret is shown
  var cb=function(){
    for (var i = 0; i < fireables.length; i++) {
      fireables[i][0].fire_event(vt,cmd+'_done',args,fireables[i][1]);
      global_fire_done();
    }
  };
  return [ret,cb];
}

