// Copyright (c) 2010 Nicholas C. Zakas. All rights reserved.
// MIT License
// taken from http://www.nczonline.net/blog/2010/03/09/custom-events-in-javascript/

function EventTarget () {
  this._listeners = {}
}
EventTarget.prototype = {

  addListener: function (type, listener) {
    hdef(this._listeners, type, listener)
    return this
  },

  fire: function (evt) {
    if (typeof evt === 'string') {
      evt = { type: evt }
    }
    if (!evt.target) {
      evt.target = this
    }

    if (!evt.type) { // falsy
      throw new Error("Event object missing 'type' property.")
    }

    if (this._listeners[evt.type] instanceof Array) {
      var listeners = this._listeners[evt.type]
      for (var i = 0, len = listeners.length; i < len; i++) {
        listeners[i].call(this, evt)
      }
    }
    return this
  },

  removeListener: function (type, listener) {
    if (this._listeners[type] instanceof Array) {
      var listeners = this._listeners[type]
      for (var i = 0, len = listeners.length; i < len; i++) {
        if (listeners[i] === listener) {
          listeners.splice(i, 1)
          break
        }
      }
    }
    return this
  }
}
