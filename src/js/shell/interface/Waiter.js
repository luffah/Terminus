function Waiter(){
  /// How to see some interface is busy to do things : i don't know
  /// so i add a busy state
  this.waiting_fus = []
  this.busy = false
  this.wait_free = (fu) => { this.waiting_fus.push(fu) }
  this.loop_waiting = () => {
    var wcnt = 0; var t = this
    if (!t.waiting_interval) {
      /// check every .5 second
      /// if busy then pass
      /// if not, then try run waiting actions
      /// if no action is found, then continue checking
      ///                        during 5 second
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
