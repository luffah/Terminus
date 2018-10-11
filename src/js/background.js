var w=window.innerWidth;
var h=window.innerHeight;
var bgcanvas=document.createElement('canvas');
bgcanvas.setAttribute('style','position:fixed;top:0;left:0;z-index:-1');
bgcanvas.setAttribute('width',w);
bgcanvas.setAttribute('height',h);
var bgctx=bgcanvas.getContext("2d");
var bgimg=bgctx.createImageData(w,h);
var bg_locked=false;
var ran_color=[[0,33],[0,33],[0,33]];
// document.body.setAttribute('style','background:transparent');
// document.getElementById('term').setAttribute('style','background:transparent;');
document.getElementById('term').setAttribute('style','background:rgba(0,0,0,0.6)');
document.body.appendChild(bgcanvas);
document.body.appendChild(bgcanvas);

function randomBg(ctx,colorrange){
  img=ctx.getImageData(0,0,w,h);
  for (let i=0; i<w*h*4; i=i+4){
    r=Math.floor((colorrange[0][0]+Math.random()*colorrange[0][1]));
    g=Math.floor((colorrange[1][0]+Math.random()*colorrange[1][1]));
    b=Math.floor((colorrange[2][0]+Math.random()*colorrange[2][1]));
    img.data[i]=r;
    img.data[i+1]=g;
    img.data[i+2]=b;
    img.data[i+3]=255;
  }
  return img;
}

function randomFill(ctx,pxlsize,colorrange,matrix){
  var r,g,b,m=[1,1,1];
  for (let i=0; i<w; i=i+pxlsize){
    for (let j=0; j<h; j=j+pxlsize){
      m=matrix(i, j, m, w, h);
      r=Math.floor((colorrange[0][0]+Math.random()*colorrange[0][1])*m[0]);
      g=Math.floor((colorrange[1][0]+Math.random()*colorrange[1][1])*m[1]);
      b=Math.floor((colorrange[2][0]+Math.random()*colorrange[2][1])*m[2]);
      ctx.fillStyle = 'rgba('+r+','+g+','+b+',255)';
      ctx.fillRect(i, j, pxlsize,pxlsize);
    }
  }
  // setup
  var buffer = document.createElement('canvas');
  buffer.width = w;
  buffer.height = h;
  buffer.getContext('2d').drawImage(bgcanvas, 0, 0);
  return buffer;
}

function matrixfu(i, j, m, w, h){
  m[0]=(1+(i/h)/4);
  m[1]=(1+(i/w));
  m[2]=(1+(j/h));
  return m;
}
var bg_data={};
// randomBg(ctx,ran_color);
for (let i=4; i<=128;i=i*2){
  bg_data[i]=randomFill(bgctx,i,ran_color,matrixfu);
}
bgctx.drawImage(bg_data[4], 0, 0);
for (let i=0; i<4;i=i+1){
  bg_data[-i]=randomFill(bgctx,4,ran_color,matrixfu);
}
var bgcnt=0;
function enter_room_effect(){
  let seq=new Seq();

  seq.then(function(next){
    bgctx.drawImage(bg_data[4],0,0);
    setTimeout(next,60);
  });
  seq.then(function(next){
    bgctx.drawImage(bg_data[8],0,0);
    setTimeout(next,60);
  });
  seq.then(function(next){
    bgctx.drawImage(bg_data[16],0,0);
    setTimeout(next,60);
  });
  seq.then(function(next){
    bgctx.drawImage(bg_data[32],0,0);
    setTimeout(next,60);
  });
  // seq.then(function(next){
    // bgctx.drawImage(bg_data[64],0,0);
    // setTimeout(next,100);
  // });
  // seq.then(function(next){
    // bgctx.drawImage(bg_data[128],0,0);
    // setTimeout(next,100);
  // });
  seq.then(function(next){
    bgctx.drawImage(bg_data[4],0,0);
  });
  seq.next();
}
function enter_effect(){
  bgctx.drawImage(bg_data[-(bgcnt++%4)],0,0);
}
