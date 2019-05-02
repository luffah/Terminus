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
