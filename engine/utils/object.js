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

function consume(h, keys) {
  let ret = {}
  for (let k of keys) {
    ret[k] = h[k]
    delete h[k]
  }
  return ret
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

// function isObj(v){
//   return (typeof v === 'object');
// }

// function pushDef(v,h){
//   if (typeof v !== 'undefined'){
//     h.push(v);
//   }
// }

function clone (obj) {
  if (obj == null || typeof obj !== 'object') return obj
  return hmap(clone, obj.constructor(), obj)
}


function get (h, v) {
  if (h) {
    return h[v]
  }
}

let eventEmitterMixin = {
  _listeners : {},
  on(eventName, handler) {
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = [];
    } else {
      this.off(eventName, handler) // no double
    }
    this._listeners[eventName].push(handler);
  },
  off(eventName, handler) {
    let handlers = this._listeners[eventName];
    for (let i = 0; i < handlers.length; i++) {
      if (handlers[i] === handler) {
        handlers.splice(i--, 1);
      }
    }
  },
  emit(eventList, target){
    let functions = []
    for (i in eventList){
      let listeners = this._listeners[eventList[i]]
      if (listeners) {
        for (e in listeners){
          f=listeners[e]
          if (f && (i == 0 || functions.indexOf(f) !== -1)){
            functions.push(f)
          }
        }
      }
    }
    for (let i in functions){
      functions[i].call(this, target)
    }
  }
}
// if (!Object.keys) {
//     Object.keys = function (obj) {
//         var arr = [],
//             key;
//         for (key in obj) {
//             if (obj.hasOwnProperty(key)) {
//                 arr.push(key);
//             }
//         }
//         return arr;
//     };
// }
let addonMixin = {
  addon(addon, args){
    if (typeof addon === 'function') {
      addon.call(this, args)
    } else {
      for (var i in addon) {
         if (addon.hasOwnProperty(i)) {
            this[i] = addon[i];
         }
      }
    }
    return this
  }
}

let waiterMixin = {
  /// How to see some interface is busy to do things : i don't know
  /// so i add check busy state every n millisecond
  waiting_fus : [],
  busy : false,
  wait_free(fu){
    this.waiting_fus.push(fu)
  },
  loop_waiting(){
    var wcnt = 0; var t = this
    if (!t.waiting_interval) {
      t.waiting_interval = setInterval(function () {
        if (t.busy) {
          wcnt = 0
        } else if ((t.waiting_fus.length > 0)) {
          let fu = t.waiting_fus.shift()
          if (fu) fu(t)
        } else {
          wcnt++
          if (wcnt > 10) {
            clearInterval(t.waiting_interval)
          }
        }
      }, 500)
    }
  }
}

