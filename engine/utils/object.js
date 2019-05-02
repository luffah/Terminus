function def (v) {
  return (typeof v !== 'undefined')
}

function objToStr (o) {
  return o.toString()
}

const keys = Object.keys

function inject (o1, o2, lk) {
  if (typeof lk === 'function') {
    lk = Object.getOwnPropertyNames(o2).filter(lk)
  }
  (lk || Object.getOwnPropertyNames(o2)).forEach(k => {
    o1[k] = o2[k]
  })
  return o1
}

function hmap (f, o1, o2) {
  Object.keys(o2).forEach(k => {
    o1[k] = f(o2[k], k)
  })
  return o1
}

// function union (obj1, obj2) {
//   return inject(inject({}, obj1), obj2)
// }

function clone (obj) {
  if (obj == null || typeof obj !== 'object') return obj
  return hmap(clone, obj.constructor(), obj)
}

// function isObj(v){
//   return (typeof v === 'object');
// }

function get (h, v) {
  if (h) {
    return h[v]
  }
}
// function pushDef(v,h){
//   if (typeof v !== 'undefined'){
//     h.push(v);
//   }
// }
