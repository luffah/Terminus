  // Scroll the window to the last element (bottom of page)
  scrl: function (timeout, retry) {
    let t = this
    let m = t.monitor
    retry = d(retry, 2)
    let misspos = m.parentNode.offsetTop + m.offsetTop + m.offsetHeight + t.inputdiv.offsetHeight - window.pageYOffset - window.innerHeight
    if (misspos > 0) {
      if (!t.scrl_lock) {
        if (!def(timeout)) {
          //          var c=t.container;
          window.scrollBy(0, misspos)
          //          t.container.style="margin-top:"+
          //           (
          //             window.inn
          //             -
          //             document.defaultView.getComputedStyle(vt.container)
          //             .getPropertyValue('margin-top').replace('px','')
          //           )+"px";
          //          window.scrollTo(0, m.parentNode.offsetTop + m.offsetTop + m.offsetHeight+t.inputdiv.offsetHeight);
          return true
        }
      }
      timeout = d(timeout, 100)
      retry--
      if (retry > 0) {
        setTimeout(function () {
          t.scrl(0, retry)
        }, timeout)
      }
    }
  },

    ///  ????
    // ---- --- - -- --- -- ---- - -- --- -- -
    // (window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop) ought to give you the current scroll position in just about any browser.

    // The three scrolling functions you'll want to concern yourself with are window.scroll(x,y), window.scrollBy(dx,dy), and window.scrollTo(x,y).
    // As David mentioned you'll need the scroll position to know where you are and use the window.onscroll event to fire off this calculation.

    // window.onload = function () {
    //  window.onscroll = function () {
    //    var doc = document.body,
    //    scrollPosition = doc.scrollTop,
    //    pageSize = (doc.scrollHeight - doc.clientHeight),
    //    percentageScrolled = Math.floor((scrollPosition / pageSize) * 100);
    //
    //     if (percentageScrolled >= 50){ // if the percentage is >= 50, scroll to top
    //       window.scrollTo(0,0);
    //     }
    //   };
    // };

  // ---- --- - -- --- -- ---- - -- --- -- -
