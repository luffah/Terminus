function isStr (v) {
  return (typeof v === 'string')
}

function addspace (i) { return i + ' ' }

function no_accents (str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

String.prototype.printf = function (vars) {
  var i = -1
  return this.replace(/\%[sd]/g,
    function (a, b) {
      i++
      return vars[i]
    })
}

// function anyStr(v,w){
//	 return typeof v === 'string' ? v : (typeof w == 'string' ? w : null) ;
// }
// function aStrArray(v){
//   return typeof v === 'string' ? [v] : ((v && v.length) ? v : []);
// }
// String.prototype.replaceAll = function(from, to){
//	ret = this.toString();
//	while (ret.indexOf(from) > 0){
//		ret = ret.replace(from, to);
//	}
//	return ret;
// };

// input specific - from js fiddle
// function findWord(str,pos){
//    var words=str.split(' ');
//    var offset=0;
//    var i;
//    for(i=0;i<words.length;i++){
//        offset+=words[i].length+1;
//        if (offset>pos) break;
//
//    }
//    return words[i];
// }
