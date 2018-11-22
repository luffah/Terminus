
function Music(soundbank){
  this.current=0;
  this.currentmusic=null;
  this.soundbank=soundbank;
}

function setAudioLoop(audio,bool){
  audio._loop = bool;
}
function setAudioFade(audio,fade){
//  steps=fade[3]/100;
//  audio.volume=fade[0];

//  console.log(fade);
//  for (var i=steps;i>0;i--){
//    setTimeout(function(){
//      audio.volume=parseFloat(((fade[1]-fade[3])*(i/steps))+fade[3]).toPrecision(4);
//    },i*100);
//  } 
//  setTimeout(function(){
//    audio.volume=fade[1]; 
//  },fade[2]);
}
Music.prototype = {
  set:function(ref,file,exts){
    this.soundbank.set(ref,file,exts,{required:false});
  },
  play:function(ref,attrs){
    attrs=d(attrs,{});
    n=this.soundbank.get(ref);
    if (this.current!==ref ){
      console.log('play ' +ref);
      c=this.soundbank.get(this.current);
      if (c){
        c.pause();
        c.currentTime=0;
      }
      if (n){
//        console.log(n);
        this.current=ref;
        setAudioLoop(n,d(attrs.loop,false));
        setAudioFade(n,d(attrs.fadein,[1,1,0]));
        n.currenttime=d(attrs.currenttime,0);
        this.currentmusic=n.play();
      }
    } else {
      if (!n._loop){
        n.stop(this.currentmusic);
        this.currentmusic=n.play();
      }
    }
  },
  fadeTo:function(vol,time){
    c=this.soundbank.get(this.current);
    if (c){
      setAudioFade(c,[c.volume,vol,time]);
    }
  }

};

