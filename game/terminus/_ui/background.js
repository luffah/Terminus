class Bg {
  constructor (el) {
    this.canvas = el
    this.data = {}
  }
  updateSize () {
    let b = this.canvas.getBoundingClientRect()
    if (b.width) {
      this.w = b.width
      this.h = b.height
    } else {
      this.w = this.canvas.width
      this.h = this.canvas.height
    }
    this.ctx = this.canvas.getContext('2d')
  }
  setData (idx, f) {
    let t = this
    t.updateSize()
    let buf = addAttrs(dom.El('canvas'), {
      style: 'display:none',
      width: t.w,
      height: t.h
    })
    let ctx = buf.getContext('2d')
    f(ctx, t.w, t.h)
    t.data[idx] = buf
  }
  setPxlData (idx, pxlw, pxlh, f, d) {
    this.setData(idx, (ctx, w, h) => {
      let maxh = h / pxlh
      let maxw = w / pxlw
      console.log(maxh, maxw)
      for (let i = 0; i < 1 + maxw; i++) {
        for (let j = 0; j < 1 + maxh; j++) {
          ctx.fillStyle = f(maxw, i, maxh, j, d, idx)
          ctx.fillRect(i * pxlw, j * pxlh, pxlw, pxlh)
        }
      }
    })
  }
  draw (idx, cnt) {
    let t = this
    // cnt = cnt || 0
    if (idx in t.data) {
      t.ctx.drawImage(t.data[idx], 0, 0)
    }
    // else if (cnt < 10) { // try to draw later
    // setTimeout(() => t.draw(idx, ++cnt), 200)
    // }
  }
}

function bgColorF (w, i, h, j, c, idx) {
  let lum = j / h + (idx - c[2]) / (c[3] - c[2])
  let r = Math.floor((c[0][0] + Math.random() * c[1][0] * (1.5 - lum)))
  let g = Math.floor((c[0][1] + Math.random() * c[1][1] * (2 - lum)))
  let b = Math.floor((c[0][2] + Math.random() * c[1][2] * (2.1 - lum)))
  return 'rgba(' + (r > 0 ? r : 0) + ',' + (g > 0 ? g : 0) + ',' + (b > 0 ? b : 0) + ',255)'
}

var tmp = {
  bgcnt: 0,
  bgmu: 0,
  bgdec: 0,
  bg: new Bg(
    addAttrs(dom.El('canvas'), {
      id: 'canvas',
      class: 'blur',
      width: 700,
      height: 21
    }))
}

function splithex (s) {
  return [parseInt(s.substr(1, 2), 16),
    parseInt(s.substr(3, 2), 16),
    parseInt(s.substr(5, 2), 16)]
}

function loadBackgroud (step) {
  let colorok = [splithex('#22b14c'), [-0x22, -0xb1, -0x4c], 0, 12]
  let colorko = [splithex('#ff2c2c'), [-0xff, -0x2c, -0x2c], 12, 24]
  if (step === 'init') {
    vt.cmdline.insertBefore(tmp.bg.canvas, vt.cmdline.childNodes[0])
    for (let i = 0; i < 12; i++) tmp.bg.setPxlData(i, 7, 7, bgColorF, colorok)
    for (let i = 12; i < 24; i++) tmp.bg.setPxlData(i, 7, 7, bgColorF, colorko)
    tmp.bg.draw(0)
  }
}
function showBackground () {
  tmp.bg.draw(0)
}
vt.effects.enter_room = function () {
  let seq = new Seq()
  for (let i = 5; i < 7; i++) {
    seq.then(function (next) {
      tmp.bg.draw(tmp.bgcnt++ % 12)
      setTimeout(next, 200)
    })
  }
  seq.next()
}
vt.effects.key.Enter = function (vt) {
  tmp.bgdec = vt.ctx.isValidInput(vt.input.value) ? 0 : 12
  tmp.bgmu += 1
  tmp.bg.draw(tmp.bgdec + (tmp.bgcnt++ % 12))
  tmp.bgInterval = setInterval(() => {
    tmp.bg.draw(tmp.bgdec + (tmp.bgcnt++ % 12))
  }, 100)
  tmp.bg.canvas.className = 'enter'
  if (tmp.bgmu === 1) {
    tmp.i = setInterval(() => {
      tmp.bgmu--
      if (tmp.bgmu === 0) {
        tmp.bg.canvas.className = 'blur'
        clearInterval(tmp.i)
        setTimeout(
          () => { if (tmp.bgmu === 0) clearInterval(tmp.bgInterval) },
          1000)
      }
    }, 600)
  }
}
