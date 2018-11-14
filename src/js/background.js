function Background (w, h, x, y) {
  this.canvas = addAttrs(dom.El('canvas'), {
    style: 'position:fixed;top:'+y+';left:'+x+';z-index:-2',
    width: w,
    height: h
  })
  this.w = w
  this.h = h
  this.ctx = this.canvas.getContext('2d')
  this.data = {}
  dom.body.appendChild(this.canvas)
}
Background.prototype = {
  setRandomData: function (idx, pxlsize, c, gradient) {
    let r; let g; let b; let m = [1, 1, 1]
    let buf = addAttrs(dom.El('canvas'),{
      style: 'display:none',
      width: this.w,
      height: this.h
    })
    let ctx = buf.getContext('2d')
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
  draw: function (idx, cnt) {
    let t = this
    cnt = cnt || 0
    if (this.data[idx]) {
      this.ctx.drawImage(this.data[idx], 0, 0)
    } else if (cnt < 10) {
      setTimeout(() => t.draw(idx, ++cnt), 200)
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

var _bgl = new Background(window.innerWidth/2,window.innerHeight,0,0)
var _bg = new Background(window.innerWidth/2,window.innerHeight,'50%',0)
function gradient (i, j, m, w, h) {
  var mt = clone(m)
  m[0] = (1 + i / w) / mt[2]
  m[1] = (1 + i / w) / mt[0]
  m[2] = (1 + i / w) / mt[1]
  return m
}

function igradient (i, j, m, w, h) {
  var mt = clone(m)
  m[0] = (2 - i / w) / mt[2]
  m[1] = (2 - i / w) / mt[0]
  m[2] = (2 - i / w) / mt[1]
  return m
}

var tmp={}
tmp.bgcnt = 0
tmp.colorrange=hex2rgbrange(['22b14c', '000000'])
tmp.loadinitbg=function () {
  if (vt.busy) {setTimeout(tmp.loadinitbg,1000)}
  else {
  _bgl.setRandomData(-tmp.bgcnt, 7, tmp.colorrange, gradient)
  _bg.setRandomData(-tmp.bgcnt, 7, tmp.colorrange, igradient)
  if (++tmp.bgcnt<3) { setTimeout(tmp.loadinitbg,600)}
  }
}
tmp.bgcnt2 = 1
tmp.loadgamebg=function () {
  if (vt.busy) {setTimeout(tmp.loadgamebg,1000)}
  else {
  _bg.setRandomData(tmp.bgcnt2, Math.pow(2,tmp.bgcnt2+3), tmp.colorrange, gradient)
   if (++tmp.bgcnt2<5) { setTimeout(tmp.loadgamebg,1000)}
  }
}

function loadBackgroud(step){
  tmp['load'+step+'bg']()
}

function showBackground(){
  _bg.draw(0)
  _bgl.draw(0)
}

function enter_room_effect () {
  let seq = new Seq()
  for (let i = 1; i < 3; i++) {
    seq.then(function (next) {
      _bg.draw(i)
      setTimeout(next, 200)
    })
  }
  seq.then(function (next) {
    _bg.draw(0)
  })
  seq.next()
}

var bgcnt = 0
var bglcnt = 0
function enter_effect () {
  if ((bgcnt + bglcnt) % 3) {
    _bgl.draw(-(bglcnt++ % 3))
  } else {
    _bg.draw(-(bgcnt++ % 3))
  }
}
