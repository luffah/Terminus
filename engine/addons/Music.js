// function setAudioFade (audio, fade) {
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
// }
class Music {
  constructor (soundbank, h) {
    this.current = 0
    this.currentmusic = null
    this.soundbank = soundbank
    this.soundbank.add(h)
  }
  play (ref, attrs) {
    attrs = attrs || {}
    let n = this.soundbank.get(ref)
    if (this.current !== ref) {
      // console.log('play ' +ref);
      let c = this.soundbank.get(this.current)
      if (c) {
        c.pause()
        c.currentTime = 0
      }
      if (n) {
        //        console.log(n);
        this.current = ref
        n._loop = attrs.loop || false
        // setAudioFade(n, attrs.fadein || [1, 1, 0])
        n.currenttime = attrs.currenttime || 0
        this.currentmusic = n.play()
      }
    } else {
      if (!n._loop) {
        n.stop(this.currentmusic)
        this.currentmusic = n.play()
      }
    }
  }

  // fadeTo(vol, time) {
  //   let c = this.soundbank.get(this.current)
  //   if (c) {
  //     setAudioFade(c, [c.volume, vol, time])
  //   }
  // }
}
