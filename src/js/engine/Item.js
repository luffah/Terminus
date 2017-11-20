function File(name,picname,prop){
  prop=prop||{};
  this.executable=d(prop.executable,false);
  this.readable=d(prop.readable,true);
  this.writable=d(prop.writable,false);
  this.picture = new Pic(picname,prop) ;
  this.cmd_event={};
  this.cmd_text = {};
  this.name=name;
  this.uid=prop.uid||getObjUID();
  this.poprefix=prop.poprefix;
  //  this.group='';
  //  this.owner='';
  EventTarget.call(this);
}
File.prototype=union(EventTarget.prototype,{
  toString : function(){
    return this.name;
  },
  chmod:function(chmod){
    this.readable=d(chmod.read,this.readable);
    this.executable=d(chmod.exec,this.readable);
    this.writable=d(chmod.write,this.readable);
    return this;
  },
  getName:function(){
    return this.name;
  },
  setName:function(name){
    this.name=name;
    return this;
  },
  getPic: function(){
    return this.picture;
  },
  setPic: function(pic){
    this.picture.set(pic);
  },
  unsetCmdEvent : function(cmd) {
    delete this.cmd_event[cmd];
    return this;
  },
  setCmdEvent : function(cmd, fun) {
    this.cmd_event[cmd] = fun || cmd;
    return this;
  },
  setCmdEvents : function(h) {
    for (var i in h) {
      if (h.hasOwnProperty(i)){
        this.setCmdEvent(i, h[i]);
      }
    }
    return this;
  },
  setCmdText : function(cmd, text) {
    this.cmd_text[cmd] = text;
    return this;
  },
  unsetCmdText : function(cmd){
    delete this.cmd_text[cmd];
    return this;
  },
  addState : function(name,fun){
    name=this.uid+name;
//    this.ev.addListener(name,state.Event);
    this.addListener(name,state.Event);
    state.add(name,fun);
    return this;
  },
  addStates : function(h){
    if (isObj(h)){
      for (var i in h) {
        if (h.hasOwnProperty(i)){
          name=this.uid+i;
//          this.ev.addListener(name,state.Event);
          this.addListener(name,state.Event);
          state.add(name,h[i]);
        }
      }
    } else {
      console.error('addStates shall receive a dictionnary {} as argument, if you want to declare only on state us addState');
    }
    return this;
  },
  apply:function(stname){
    this.fire(this.uid+stname);
    return this;
  },
});

function Item(name, intro, picname, prop){
  prop=prop||{};
  prop.poprefix=d(prop.poprefix,POPREFIX_ITEM);
  File.call(this,name,picname,prop);
  this.cmd_text = {less: intro ? intro : _(PO_DEFAULT_ITEM)};
//  this.valid_cmds = ["less"];
  //  this.owner='';
  this.room=null;
//  this.ev = new EventTarget();
  if (prop.poid){
    this.setPo(prop.poid,prop.povars);
  }
}
Item.prototype=union(File.prototype, {
  addPicMod : function (id,picname,prop){
    var newpic=new Pic(picname,prop);
    this.picture.setChild(id,newpic);
    return this;
  },
  rmPicMod : function (id,picname){
    this.picture.unsetChild(id,newpic);
    return this;
  },
  copy:function(name){
    var nut = new Item(name);
    nut.picture = this.picture.copy();
    nut.cmd_text = clone(this.cmd_text);
    nut.valid_cmds = clone(this.valid_cmds);
    nut.cmd_event = clone(this.cmd_event);
    nut._listeners = clone(this._listeners);
    nut.room = this.room;
    nut.people = this.people;
    nut.poprefix = this.poprefix;
    return nut;
  },
  setExecFunction:function(fu){
    this.exec_function=fu;
  },
  unsetExecFunction:function(){
    this.exec_function=undefined;
  },
  exec:function(args,room,vt){
    var it=this;
    this.fire_event(vt,'exec',args);
    if (this.exec_function){
      return this.exec_function(this,args,room,vt);
    } else {
      return cmd_done(vt,[[it,0]],it.cmd_text.less,'exec',args);
    }
  },
  setPo:function(name,vars){
    this.poid=this.poprefix+name;
    this.povars=vars;
    this.name=_(this.poid,vars);
    this.cmd_text.less=_(this.poid+POSUFFIX_DESC,vars);
    return this;
  },
  checkTextIdx : function(textidx) {
    return dialog.hasOwnProperty(this.poid+POSUFFIX_DESC+textidx);
  },
  setTextIdx : function(textidx,vars) {
    this.cmd_text.less = _(this.poid+POSUFFIX_DESC+textidx,vars,{or:this.poid+POSUFFIX_DESC});
    return this;
  },
//  setTextIdx : function(textidx,vars) { // TODO with range
//    this.cmd_text.less = _(this.poid+POSUFFIX_DESC+textidx,vars,{or:this.poid+POSUFFIX_DESC});
//    return this;
//  },
  setPoDelta:function(delta){
    if (typeof delta == 'string'){
      this.poid+=delta;
    } else {
      this.povars=delta;
    }
    this.name=_(this.poid,this.povars);
    this.cmd_text.less=_(this.poid+POSUFFIX_DESC,this.povars);
    return this;
  },
  fire_event:function(vt,cmd,args,idx){
    var ev_trigger=null;
    var context={term:vt,room:this.room, item:this, arg:(def(idx)?args[idx]:null), args:args, i:idx};
//    console.log(this.cmd_event);
    if (cmd in this.cmd_event) {
      console.log(this.uid+' EVENT '+cmd);
      ev_trigger = this.cmd_event[cmd];
    }
    if (ev_trigger) {
      var ck=(typeof ev_trigger === "function" ? ev_trigger(context) : ev_trigger);
      if (ck) {
        console.log(this.uid+' FIRE '+ck);
        this.fire(this.uid+ck);
      }
    }
  },
  disappear : function(){
    this.room.removeItemByName(this.name);
  },
  moveTo : function(room){
    this.room.removeItemByName(this.name);
    room.addItem(this);
    return this;
  },
});
function People(name,intro,picname,prop){
  //Inherit instance properties
  prop=prop||{};
  prop.poprefix=d(prop.poprefix,POPREFIX_PEOPLE);
  Item.call(this, name, intro,picname, prop);
  this.people=true;
}
People.prototype=Item.prototype;
