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

var CONSONANT = 'bcdfghjklmnpqrstvwxz'

function articulate (txt) {
  let node = document.createElement('p')
  node.innerHTML = txt
  let tret = []
  for (let i = 0; i < node.childNodes.length; i++) {
    let o = node.childNodes[i]
    if (o.data) {
      let txttab = o.data.split('')
      let syl = ['', '']
      let idx = 0
      let prev = 0
      while (txttab.length) {
        if (/[-']/.test(txttab[0])) {
          syl[idx] += txttab.shift()
          prev = 0
        } else if (/\W/.test(txttab[0])) {
          if (syl[0]) { tret.push(syl.join('')); syl = ['', '']; idx = 0 }
          tret.push(txttab.shift())
          prev = 0
        } else if (CONSONANT.indexOf(txttab[0]) != -1) {
          if (prev == 0) {
            syl[idx] += txttab.shift()
          }
          if (prev == 1) {
            syl[idx] += txttab.shift()
            if (idx) { tret.push(syl.shift()); syl.push('') }
            else idx++
          }
          prev = 0
        } else {
          if (idx) {
            if (prev == 0 && syl[idx].length > 0) {
              tret.push(syl.shift())
              syl.push('')
              idx--
              syl[idx] += txttab.shift()
            } else {
              syl[idx] += txttab.shift()
            }
          } else {
            syl[idx] += txttab.shift()
          }
          prev = 1
        }
      }
      if (syl[0]) tret.push(syl.join(''))
    } else {
      tret.push(o)
    }
  }
  delete node
  return tret
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
