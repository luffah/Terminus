var audiotype={mp3:'mpeg',ogg:'ogg',wav:'wav'};

function SoundBank(callback){
  this.ldr=0;
  this.dict={};
  this.callback=d(callback,null);

}

SoundBank.prototype={
  set: function(ref,file,exts,extra){
    let t=this;
    extra=d(extra,{});
    required=d(extra.required,true);
    t.ldr++;
    t.dict[ref]=new Howl({
      src:exts.map((i) => file+i),
      onload:function(){ t.ldr--; if(t.callback){t.callback();}}
    });
  },
  isloaded: function(){
   return this.ldr==0;
  },
  play: function(key){
   if (this.dict.hasOwnProperty(key)){
      this.dict[key].currenttime=0;
      this.dict[key].volume=1;
      this.dict[key].play();
    }
  },
  get: function(key){
    return this.dict[key];
  }
};

