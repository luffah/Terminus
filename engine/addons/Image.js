Room.prototype.img_cls = 'room'
Item.prototype.img_cls = 'item'
People.prototype.img_cls = 'people'

function VTermImages(args) {  // IMAGES //
  File.prototype._copiable.push('img')
  File.prototype._copiable.push('cls')
  this.addon(VTermImages.prototype)
  this.imgbank = new Images(args)
  this.imgs = {}
  this.on('ReturnStatement', function (ret){
    if (ret.render){
      let img
      if (ret.render instanceof File) {
        img = this.mkImg(ret.render)
      } else if (ret.render instanceof RenderTree) {
        var pics = []
        for (let f of ret.render.leafs){
          if (f.img && (!def(f.pic_shown_in_ls) || f.pic_shown_in_ls) && ((f.img_cls !== 'room') || f.pic_shown_as_item)) {
            pics.push(this.mkImg(f, { tmpcls: f.img_cls }))
          }
        }
        img = this.mkImg(ret.render.root, { children: pics, tmpcls: 'room'})
      }
      this.pushImg(img, ret.__index__)
    }
    this.showImgs(ret.__index__)
  })
}
VTermImages.prototype = {
  mkImg (o, attrs) {
    return this.imgbank ? this.imgbank.get(o, attrs) : false
  },
  pushImg (img, idx = -1) {
    if (img) {
      if (!this.imgs[idx]) { this.imgs[idx] = [] }
      this.imgs[idx].push(img)
    }
    return this
  },
  showImgs (idx = -1) {
    let v = this
    let imgs = v.imgs[idx]
    if (imgs && imgs.length > 0) {
      let c = addEl(v.monitor, 'div', 'img-container')
      while (imgs.length) {
        imgs.shift().render(c, () => v.emit(['ImageAdded', 'ContentAdded', 'ContentChanged']))
      }
    }
  },
  rmCurrentImg (timeout) {
    let v = this
    setTimeout(function () {
      for (let el of v.current_msg.getElementsByClassName('img-container')) {
        v.current_msg.removeChild(el)
      }
    }, timeout)
  }
}



class Images {
  constructor (h) {
    this.dict = h
  }
  get (o, attrs) {
    return new Pic(o, this.dict, attrs)
  }
}

class Pic {
  constructor (ref, bank, prop = {}) {
    this.o = ref
    if (!def(ref.zindex)) ref.zindex = 0
    this.children = prop.children || []
    this.tmpcls = prop.tmpcls
    this.bank = bank
  }
  exists () {
    return this.o.img || this.children.length
  }
  get src () {
    let res = this.bank[this.o.img]
    if (res) {
      res.used = true
      return res.src
    }
    return ''
  }
  get cls () {
    return this.o.cls
  }
  renderAsChild (cont, cnt, onload) {
    let t = this
    if (t.exists()) {
      addEl(cont, 'img',{
        class: 'layer layer-' + cnt + ' ' + (t.o.cls || '') + ' ' + (t.tmpcls || ''),
        src: t.src
      }).onload = onload
      for (let childpic of t.children) {
        childpic.renderAsChild(cont, cnt)
      }
      delete this.tmpcls
      return true
    }
  }
  render (c, onload) {
    let t = this
    if (t.exists()) {
      let cont = addEl(c, 'div', picturable({class: 'layers'}))
      let picl = new PicLayers(t, cont, onload)
      picl.update()
      cont.addEventListener('load', onload)
      return picl
    }
  }
}

class PicLayers {
  constructor (pic, cont, onload) {
    this.pic = pic
    this.cont = cont
    this.onload = onload
    this.reverseX = false
    this.reverseY = false
    this.othercls = ''
  }
  update () {
    let t = this
    let cont = t.cont; let onload = t.onload
    cont.innerHTML = ''
    cont.className = 'layers ' + t.othercls + (t.reverseX ? ' reverseX' : '') + (t.reverseY ? ' reverseY' : '')
    let over = addEl(cont, 'div', { 'class': 'foreground'})
    let behind = addEl(cont, 'div', { 'class': 'background'})
    /*FIXME : pb on load ???? epic img */
    cont.onload = (e) => {
      console.log('onload',e)
       onload(e)
    }
    let adaptHeight
    if (t.pic.o.img) {
      addEl(cont, 'img', { class: 'main ' + (t.pic.cls || '') + ' ' + (t.pic.tmpcls || ''), src: t.pic.src})
    } else {
      cont.className += ' no-main'
      let img = addEl(cont, 'div', { class: 'main ' + (t.pic.cls || '') + ' ' + (t.pic.tmpcls || '') })
      adaptHeight = (e) => {
        if (!cont.offsetHeight) {
          img.style.height = (behind.offsetHeight > over.offsetHeight ? behind.offsetHeight: over.offsetHeight) + 'px'
        }
        if (!cont.offsetWidth) {
          img.style.width = (behind.offsetWidth > over.offsetWidth ? behind.offsetWidth: over.offsetHeight) + 'px'
        }
      }
    }
    delete t.pic.tmpcls
    let cnt = 0
    for (let childpic of t.pic.children) {
      if (childpic.renderAsChild((childpic.o.zindex < 0 ? behind : over), cnt + 1, adaptHeight)) {
        cnt++
      }
    }
  }
  
}
