function Background () {
  this.ckSize()
  this.canvas = addAttrs(dom.El('canvas'), {
    style: 'position:fixed;top:0;left:0;z-index:-1',
    width: this.w,
    height: this.h
  })
  this.ctx = this.canvas.getContext('2d')
  this.data = {}
  dom.body.appendChild(this.canvas)
}
Background.prototype = {
  ckSize: function () {
    this.w = window.innerWidth
    this.h = window.innerHeight
  },
  setRandomData: function (idx, pxlsize, c, gradient) {
    let r; let g; let b; let m = [1, 1, 1]
    let buf = addAttrs(dom.El('canvas'),{
      style: 'display:none',
      width: this.w,
      height: this.h
    })
    ctx = buf.getContext('2d')
    for (let i = 0; i < this.w; i = i + pxlsize) {
      for (let j = 0; j < this.h; j = j + pxlsize) {
        m = gradient(i, j, m, this.w, this.h)
        r = Math.floor((c[0][0] + Math.random() * c[0][1]) * m[0])
        g = Math.floor((c[1][0] + Math.random() * c[1][1]) * m[1])
        b = Math.floor((c[2][0] + Math.random() * c[2][1]) * m[2])
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',255)'
        ctx.fillRect(i, j, pxlsize, pxlsize)
      }
    }
    // setup
    this.data[idx] = buf
  },
  draw: function (idx) {
    if (this.data[idx]) {
      this.ctx.drawImage(this.data[idx], 0, 0)
    }
  }
}
function hex2rgbrange (r) {
  let c = []
    for (let i = 0; i < 3; i++) {
      c[i] = [eval('0x' + r[0][i * 2] + r[0][i * 2 + 1]), eval('0x' + r[1][i * 2] + r[1][i * 2 + 1])]
    }
  for (let i = 0; i < 3; i++) {
    // transform rgb range to rgb delta
    c[i] = [c[i][0], c[i][1] - c[i][0]]
  }
  return c
}
dom.Id('term').style = 'background:rgba(0,0,0,0.9)'

var _bg = new Background()
function gradient (i, j, m, w, h) {
  var mt = clone(m)
  m[0] = (1 + (i / w)) / mt[2]
  m[1] = (1 + (i / w)) / mt[0]
  m[2] = (1 + (i / w)) / mt[1]
  return m
}
var tmp={}
tmp.bgcnt = 0
tmp.colorrange=hex2rgbrange(['22b14c', '000000'])
tmp.bginterval=function () {
  _bg.setRandomData(-tmp.bgcnt, 7, tmp.colorrange, gradient)
  _bg.draw(-tmp.bgcnt)
  if (++tmp.bgcnt<8) { setTimeout(tmp.bginterval,100)}
}
tmp.bgcnt2 = 0
tmp.bginterval2=function () {
  _bg.setRandomData(tmp.bgcnt2, 2 ** tmp.bgcnt2, tmp.colorrange, gradient)
   if (++tmp.bgcnt<5) { setTimeout(tmp.bginterval2,100)}
}
setTimeout(tmp.bginterval,100)
setTimeout(tmp.bginterval,1000)

function enter_room_effect () {
  let seq = new Seq()
  for (let i = 2; i <= 5; i++) {
    seq.then(function (next) {
      _bg.draw(i)
      setTimeout(next, 60)
    })
  }
  seq.then(function (next) {
    _bg.draw(2)
  })
  seq.next()
}
var bgcnt = 0
function enter_effect () {
  _bg.draw(-(bgcnt++ % 8))
}
