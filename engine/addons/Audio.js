function VTermAudio(args) { 
  this.soundbank = new SoundBank(args.sound)
  this.musicbank = new Music(this.soundbank, args.music)
  this.addon({
    // SOUND
    playSound (key) {
      if (!this.mute && this.soundbank) {
        // console.log(key)
        this.soundbank.play(key)
      }
    },
    playMusic (key, attrs) {
      if (!this.mute && this.musicbank) {
        this.musicbank.play(key, attrs)
      }
    }
  })
}

// var audiotype = { mp3: 'mpeg', ogg: 'ogg', wav: 'wav' }

class SoundBank {
  constructor (h, callback) {
    this.ldr = 0
    this.snds = {}
    this.refs = {}
    this.callback = callback
    this.add(h)
  }

  add (h) {
    hmap((it, k) => this.set(k, it, it.src[0], [it.src[1]]), {}, h)
  }

  set (ref, orig, file, exts) {
    let t = this
    t.ldr++
    t.refs[ref] = orig
    t.snds[ref] = new Howl({
      src: exts.map((i) => file + i),
      onload: function () { t.ldr--; if (t.callback) { t.callback() } }
    })
  }

  isloaded () {
    return this.ldr === 0
  }

  play (key) {
    let snd = this.get(key)
    if (snd) {
      snd.stop()
      snd.currenttime = 0
      snd.volume = 1
      snd.play()
    }
  }
  get (key) {
    let snd = this.snds[key]
    let ref = this.refs[key]
    if (ref) ref.used = true
    return snd
  }
}

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
