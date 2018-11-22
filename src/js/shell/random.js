function randomSort(){
  return 0.5 - Math.random();
}
function shuffleStr(src,complexity){
  var randsArr = "!@#$)~_(%^&.abcdefghijklmnopqrstuvwxyz -0123456789".repeat(src.length/10+1).split('').sort(randomSort);
  var ret='';
  for (var i=0;i<src.length;i++){
    ret+= (Math.random()>complexity ? src[i] : randsArr.shift());
  }
  return ret;
}
function randomStr(length){
  var randsArr = (". abcdefghijklmnopqrstuvwxyz -0123456789").repeat(length).split('').sort(randomSort);
  return randsArr.slice(0,length).join('');
}
