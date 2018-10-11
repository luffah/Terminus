function _stdout(a){return {stdout:a};}
function _stderr(a){return {stderr:a};}
function ReturnSequence(list){
  this.seq=list;
  this.isReturnSequence=true;
  this.idx=0;
}
ReturnSequence.prototype={
  next:function(){
    this.idx++;
    return this.seq.shift();
  },
//  pop:function(){
//    return this.seq.pop();
//  },
  length:function(){
    return this.seq.length;
  },
  getIdx:function(){
    return this.idx;
  }

};
/* 
 * how to use a return sequence / in VTerm
 *
 * var supercb=[];
 * for (var i=0;i<echo.length();i++){
 *    supercb.push(function(){
 *      t.show_img({index:echo.getIdx()});
 *      t.show_msg(echo.next(),{cb:supercb.shift()});
 *    });
 * }
 * supercb.shift()();
 **/
