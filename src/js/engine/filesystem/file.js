var global_uid={};
function getObjUID(name){
  cntUp(global_uid,name,0);
  return  name.substr(0,4)+global_uid[name];
}

function File(name,picname,prop){
  prop=prop||{};
  this.executable=d(prop.executable,false);
  this.readable=d(prop.readable,true);
  this.writable=d(prop.writable,false);
  this.picture = new Pic(picname,prop) ;
  this.cmd_event={};
  this.cmd_hook = {};
  this.name=name;
  this.text='';
  this.uid=prop.uid||getObjUID(prop.poid||name);
//  console.log(name,this.uid);
  this.poprefix=prop.poprefix;
  //  this.group='';
  //  this.owner='';
  EventTarget.call(this);
}

File.prototype=union(EventTarget.prototype,{
  toString : function(){
    return this.name;
  },
  getHash: function(){
    hash={};
    hash['rwx']=this.readable * 4 + this.writable *2 + this.executable;
    hash['d']=this.hasOwnProperty('children')*1;
    hash['events']=this.cmd_event;
    // hash['states']=this._listeners;
    // TODO: revoir définition d'une sauvegarde... + alteration d'état room/file dans gamestate ?
    // hash['states_']=state;
    hash['picture']=this.picture.src;
    return hash;
  },
  chmod:function(chmod){
    this.readable=d(chmod.read,this.readable);
    this.executable=d(chmod.exec,this.readable);
    this.writable=d(chmod.write,this.readable);
    return this;
  },
  setReadable:function(chmod){
    this.readable=d(chmod.read,this.readable);
    return this;
  },
  setWritable:function(chmod){
    this.writable=d(chmod.write,this.readable);
    return this;
  },
  setExecutable:function(chmod){
    this.executable=d(chmod.exec,this.readable);
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
  setPo:function(name,vars){
    this.poid=this.poprefix+name;
    this.povars=vars;
    this.name=_(this.poid,vars);
    this.text=_(this.poid+POSUFFIX_DESC,vars);
    return this;
  },
  setText : function(text) {
    this.text = text;
    return this;
  },
  checkTextIdx: function (textidx) {
    return dialog.hasOwnProperty(this.poid + POSUFFIX_DESC + textidx)
  },
  setTextIdx: function (textidx, vars) {
    this.text = _(this.poid + POSUFFIX_DESC + textidx, vars, { or: this.poid + POSUFFIX_DESC })
    return this
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
  setCmd : function(cmd, fu) {
    if (typeof fu == "object"){
      fu = () => {return {ret:fu} }
    } else if (typeof fu == "string") {
      fu = () => {return {ret:_stdout(fu), pass: true}}
    }
    this.cmd_hook[cmd] = fu
    return this;
  },
  unsetCmd : function(cmd) {
    delete this.cmd_hook[cmd];
    return this;
  },
  apply : function(e){
    if (typeof e == "string"){
      name = e;
      target = this;
    } else {
      name = e.type;
      target = e.target;
    }
    state.apply(target.uid+name);
  },
  addState : function(name,fun){
    this.addListener(name,this.apply);
    state.add(this.uid+name,fun);
    this.cmd_event[name] = name;
    return this;
  },
  addStates : function(h){
    if (isObj(h)){
      for (var i in h) {
        if (h.hasOwnProperty(i)){
          this.addListener(i,this.apply);
          state.add(this.uid+i,h[i]);
          this.cmd_event[i] = i;
        }
      }
    } else {
      console.error('addStates shall receive a dictionnary {} as argument, if you want to declare only one state use addState');
    }
    return this;
  },
});

function Item(name, intro, picname, prop){
  prop=prop||{};
  prop.poprefix=d(prop.poprefix,POPREFIX_ITEM);
  File.call(this,name,picname,prop);
  this.text = intro || _(PO_DEFAULT_ITEM)
  this.room=null;
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
    nut.text = clone(this.text);
    nut.cmd_hook = clone(this.cmd_hook);
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
      return cmd_done(vt,[[it,0]],it.text,'exec',args);
    }
  },
  setPoDelta:function(delta){
    if (typeof delta == 'string'){
      this.poid+=delta;
    } else {
      this.povars=delta;
    }
    this.name=_(this.poid,this.povars);
    this.text=_(this.poid+POSUFFIX_DESC,this.povars);
    return this;
  },
  fire_event:function(vt,cmd,args,idx){
    var ev_trigger=null;
    var context={term:vt,room:this.room, item:this, arg:(def(idx)?args[idx]:null), args:args, i:idx};
    if (cmd in this.cmd_event) {
      console.log(this.uid+' EVENT '+cmd);
      ev_trigger = this.cmd_event[cmd];
    }
    if (ev_trigger) {
      var ck=(typeof ev_trigger === "function" ? ev_trigger(context) : ev_trigger);
      if (ck) {
        console.log(this.uid+' FIRE '+ck);
        this.fire(ck);
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
