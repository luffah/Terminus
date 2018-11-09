function Pic(src,prop){
  this.src=src;
  prop=d(prop,{});
  this.img_dir=d(prop.img_dir, './img/'); // shall contains last slash './img/'
  this.cls=prop.cls;
  this.shown_in_ls=d(prop.pic_shown_in_ls,true);
  this.shown_as_item=d(prop.pic_shown_as_item,false);
  this.image_class=d(prop.image_class, '');
  this.index=d(prop.index,0);
  this.children=prop.children||{};
}
function PicLayers(pic,cont,onload){
  this.pic=pic;
  this.cont=cont;
  this.onload=onload;
  this.reverseX=false;
  this.reverseY=false;
  this.image_class=d(pic.image_class, '');
  this.othercls='';
  this.offset=[0,0];
  this.gravity_coef=1;
  this.offset_prop={grid:null,val:[0,0],unit:['%','%'],prop:["left","bottom"],range:[[0,100],[0,100]]};
}
function PlatformGrid(matrix,range){
  var stepsize_x=((range[0][1]-range[0][0]) / matrix[0].length),
      stepsize_y=((range[1][1]-range[1][0]) / matrix.length);
  this.matrix=matrix;
  this.x=stepsize_x;
  this.y=stepsize_y;
  this.range=range;
}

PlatformGrid.prototype.check=function(x,y,w,h){
  let t=this;
  let ret=false;
  if (
    x>=t.range[0][0]&&y>=t.range[1][0]&&
    (x+w)<=t.range[0][1]&&(y+h)<=t.range[1][1]
  ){
    let cy=Math.floor(y/t.y),cx=Math.floor(x/t.x),ctoy=Math.floor((y+h)/t.y),ctox=Math.floor((x+w)/t.x);
    if  (cy >= 0 && cx>=0 && cy < t.matrix.length ){
      ret=true;
      for (let j=cy;j<=ctoy;j++){
        for (let i=cx;i<=ctox;i++){
          ret=ret&&(t.matrix[j][i]==0);
        }
      }
    }
  }
  return ret;
};
PicLayers.prototype={
  _setOffset:function(x,y){
    let t=this; let o=t.offset_prop;
    let nowall=(!o.grid||(o.grid.check(
      x,y,
      (t.cont.offsetWidth*100/t.cont.parentNode.offsetWidth),
      0 // don't care about height
//      (t.cont.offsetHeight*100/t.cont.parentNode.offsetHeight)
    )));
    if (nowall){
      t.offset=[x,y];
      t.cont.setAttribute('style',
//        'box-sizing:border-box;border:1px solid pink;'+
        o.prop[0]+':'+t.offset[0]+o.unit[0]+';'+
        o.prop[1]+':'+t.offset[1]+o.unit[1]+';');
      t.cont.className='layers '+t.image_class+t.othercls+(t.reverseX?' reverseX':'')+(t.reverseY?' reverseY':'');
      if (t.gravity && !t.falling) t.gravity();
      return true;
    } else {
      return false;
    }

  },
  collide:function(a){
    let t=this;
    let parw=t.cont.parentNode.offsetWidth;
    let parh=t.cont.parentNode.offsetHeight;
    let 
      x1=t.offset[0],
      y1=t.offset[1],
      h1=(t.cont.offsetHeight*100/parh),
      w1=(t.cont.offsetWidth*100/parw),
      x2=a.offset[0],
      y2=a.offset[1],
      h2=(a.cont.offsetHeight*100/parh),
      w2=(a.cont.offsetWidth*100/parw)
      ;
    return (x1 < x2 + w2 &&
      x1 + w1 > x2 &&
      y1 < y2 + h2 &&
      h1 + y1 > y2);
  },
  setPlatformGrid:function(m,range){
    this.offset_prop.grid=new PlatformGrid(m,range||this.offset_prop.range);
  },
  getPlatformGrid:function(m){
    return this.offset_prop.grid;
  },
  fallTo:function(vals,steps,interval,cb){
    let t=this; let x, y, cx, cy,o=t.offset_prop, of,down=(steps[1]<0);
    if (!t.falling||(steps[1]==0)){

      t.falling=true;
      let it=function(){
        if (steps[0]||steps[1]){
          x=t.offset[0]+steps[0];
          y=t.offset[1]+steps[1];
//          console.log(offset,steps);
          nowall=t._setOffset(x,y);
          cx=((steps[0]!=0)&&((Math.sign(steps[0])*x)<vals[0]));
          cy=((steps[1]!=0)&&((Math.sign(steps[1])*y)<vals[1]));
//          console.log([x,y],[Math.sign(steps[0])*x,Math.sign(steps[1])*y],vals,[cx,cy]);
          if (!nowall){
            nowall=t._setOffset(t.offset[0],y);
            if (nowall){steps[0]=0;cx=false;}
          }
          if (!nowall){
            nowall=t._setOffset(x,t.offset[1]);
            if (nowall){steps[1]=0;cy=false;}
          }
          if (nowall && (cy || cx)){
            setTimeout(it,interval);
          } else {
            t.falling=false;
            if (cb) cb(t,x,y);
            if (t.gravity && !down) t.gravity();
          }
        }
      };
    it();
    }
  },
  fallToY:function(y,step,interval,cb){
    this.fallTo([this.offset[0],y],[0,step],interval,cb);
  },
  fallToX:function(x,step,interval,cb){
    this.fallTo([x,this.offset[1]],[step,0],interval,cb);
  },
  setOffsetProp:function(o){
    this.offset_prop=union(this.offset_prop,o);
  },
  setOffset:function(offset){
    return this._setOffset(offset[0],offset[1]);
  },
  setOffsetDelta:function(xd,yd){
    let t=this;
    yd=yd*t.gravity_coef;
    return t._setOffset(t.offset[0]+xd,t.offset[1]+yd);
  },
  setOffsetDeltaX:function(xd){
    let t=this;
    return t._setOffset(t.offset[0]+xd,t.offset[1]);
  },
  setOffsetDeltaY:function(yd){
    let t=this;
    yd=yd*t.gravity_coef;
    return t._setOffset(t.offset[0],t.offset[1]+yd);
  },
  setOffsetDeltaXStepped:function(xd,step,interval,cb){
    let t=this;
    t.fallTo([t.offset[0]+xd,t.offset[1]],[step,0],interval,cb);
  },
  setOffsetDeltaYStepped:function(yd,step,interval,cb){
    let t=this;
    yd=yd*t.gravity_coef;
    t.fallTo([t.offset[0],t.offset[1]+yd],[0,step],interval,cb);
  },
  getOffset:function(){
    return this.offset;
  },
  getOffsetProp:function(){
    return this.offset_prop;
  },
  update:function(){
    let t=this;
    let cont=t.cont,onload=t.onload;
    //  ,over=t.over,behind=t.behind;
    //  over.innerHTML="";
    //  behind.innerHTML="";
    cont.innerHTML="";
    cont.className='layers '+t.pic.image_class+' '+t.othercls+(t.reverseX?' reverseX':'')+(t.reverseY?' reverseY':'');
    let over=addEl(cont,'div',{'class':'foreground','aria-hidden':'true'});
    let behind=addEl(cont,'div',{'class':'background','aria-hidden':'true'});
    if (t.pic.src){
      addEl(cont,'img',{class:'main '+(t.pic.cls || '')+' '+(t.pic.tmpcls || ''),src:t.pic.img_dir + t.pic.src, 'aria-hidden':'true'})
        .onload=onload;
      delete t.pic.tmpcls;
    }
    let cnt=0;
    for (let name in t.pic.children){
      if (t.pic.children.hasOwnProperty(name)){
        let childpic=t.pic.children[name];
        if (childpic.render_as_child((childpic.index<0?behind:over),cnt+1)){
          cnt++;
        }
      }
    }
  }
};
Pic.prototype={
  set:function(src){
    this.src=src;
  },
  setOneShotRenderClass:function(cls){
    this.tmpcls=cls;
  },
  setImgClass:function(cls){
    this.image_class=cls;
  },
  copy:function(children){
    return new Pic(this.src,{
      img_dir:this.img_dir,
      cls:this.cls,
      shown_in_ls:this.shown_in_ls,
      image_class:this.image_class,
      children:clone(this.children)
    });
  },
  addChildren:function(children){
    for (let name in children){
      if (children.hasOwnProperty(name)){
        this.children[name]=children[name];
      }
    }
  },
  setChild:function(name,child,prop){
    var ret=!this.children.hasOwnProperty(name);
    this.children[name]=isStr(child)?new Pic(child,union(prop,{cls:'livelayer'})):child;
    return ret;
  },
  unsetChild:function(name){
    delete this.children[name];
  },
  exists:function(){
    return this.src || this.children.length;
  },
  render_as_child:function(cont,cnt){
    if (this.src) {
      addEl(cont,'img',{class:'layer layer-'+cnt+' '+(this.cls || '')+' '+(this.tmpcls || ''),src:this.img_dir + this.src, 'aria-hidden':'true'});
      for (let name in this.children){
        if (this.children.hasOwnProperty(name)){
          let childpic=this.children[name];
          childpic.render_as_child(cont,cnt);
        }
      }
      delete this.tmpcls;
      return true;
    }
    return false;
  },
  render:function(c,onload){
    let t=this;
    if (t.exists()){
      let cont=addEl(c,'div','layers');
      cont.onload=onload ;
//      console.log(t.image_class);
      let picl=new PicLayers(t,cont,onload);
      picl.update();
      return picl; 
    }
    return null;
  }
};

