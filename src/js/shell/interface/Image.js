IMG_DIR = './img/'

class Pic {
  constructor(ref, prop = {}){
    this.o = ref
    if (!def(ref.zindex)) ref.zindex = 0
    this.children = prop.children || {}
    this.tmpcls = prop.tmpcls
  }
  exists() {
    return this.o.img || this.children.length
  }
  render_as_child(cont, cnt) {
    if (this.exists) {
      addEl(cont, 'img', { class: 'layer layer-' + cnt + ' ' + (this.o.cls || '') + ' ' + (this.tmpcls || ''), src: IMG_DIR + this.o.img , 'aria-hidden': 'true' })
      for (let name in this.children) {
        if (this.children.hasOwnProperty(name)) {
          let childpic = this.children[name]
          childpic.render_as_child(cont, cnt)
        }
      }
      delete this.tmpcls
      return true
    }
  }
  render(c, onload) {
    let t = this
    if (t.exists()) {
      let cont = addEl(c, 'div', 'layers')
      cont.onload = onload
      let picl = new PicLayers(t, cont, onload)
      picl.update()
      return picl
    }
  }
}

class PicLayers {
  constructor(pic,cont,onload){
    this.pic=pic
    this.cont=cont
    this.onload=onload
    this.reverseX=false
    this.reverseY=false
    this.othercls=''
  }
  update(){
    let t=this;
    let cont=t.cont,onload=t.onload;
    cont.innerHTML="";
    cont.className='layers '+t.othercls+(t.reverseX?' reverseX':'')+(t.reverseY?' reverseY':'');
    let over=addEl(cont,'div',{'class':'foreground','aria-hidden':'true'});
    let behind=addEl(cont,'div',{'class':'background','aria-hidden':'true'});
    if (t.pic.o.img){
      addEl(cont,'img',{class:'main '+(t.pic.cls || '')+' '+(t.pic.tmpcls || ''),src:IMG_DIR + t.pic.o.img, 'aria-hidden':'true'})
        .onload=onload;
      delete t.pic.tmpcls;
    }
    let cnt=0;
    for (let name in t.pic.children){
      if (t.pic.children.hasOwnProperty(name)){
        let childpic=t.pic.children[name];
        if (childpic.render_as_child((childpic.o.zindex<0?behind:over),cnt+1)){
          cnt++;
        }
      }
    }
  }
}
