

//function Sound(src) {
//    this.sound = document.createElement("audio");
//    this.sound.src = src;
//    this.sound.setAttribute("preload", "auto");
//    this.sound.setAttribute("controls", "none");
//    this.sound.style.display = "none";
//    document.body.appendChild(this.sound);
//    this.play = function(){
//        this.sound.play();
//    }
//    this.stop = function(){
//        this.sound.pause();
//    }
//} 

var audiotype={mp3:'mpeg',ogg:'ogg',wav:'wav'};

function SoundBank(callback){
  this.ldr=0;
  this.dict={};
  this.callback=d(callback,null);

}

SoundBank.prototype={
  set: function(ref,file,exts,extra){
    var t=this;
    
    extra=d(extra,{});
    required=d(extra.required,true);
     
    
//    t.dict[ref]=prEl(document.body,'audio',{autoplay:'autoplay',preload:'auto',id:'snd'+ref});
//    t.dict[ref]=prEl(document.body,'audio',{preload:'auto',id:'snd'+ref});
//    t.dict[ref]=prEl(document.body,'audio',{autoplay:true,preload:'auto',id:'snd'+ref});
      t.ldr++;
    t.dict[ref]=new Howl({
      src:exts.map(function(i){return file+i;}),
//      volume:0,
      onload:function(){ t.ldr--; if(t.callback){t.callback();}}
    });
//      this.dict[ref].volume=0;
//    if (required){
//      if (t.callback){
//        t.dict[ref].addEventListener('loadeddata',function(){ t.ldr--;t.callback();},false);
//      }
//    }
//    for (var i = exts.length - 1; i >= 0; i--) {
//      addEl(t.dict[ref],'source',{src:file+exts[i],type:'audio/'+audiotype[exts[i]]});
//    }
  },
  isloaded: function(){
   return this.ldr==0;
  },
  play: function(key){
   if (this.dict.hasOwnProperty(key)){
//      this.dict[key].setAttribute('autoplay','true'); 
      this.dict[key].currenttime=0;
      this.dict[key].volume=1;
      this.dict[key].play();
    }
  },
  get: function(key){
    if (this.dict.hasOwnProperty(key)){
      return this.dict[key];
    } else {
      return null; 
    }
  }
};

