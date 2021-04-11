function xhr_load(html, scripts, css){
  document.open()
  var el = document.createElement( 'html' )
  var xhr = new XMLHttpRequest()
  xhr.open("GET", html)
  xhr.setRequestHeader('Content-type',
    'application/x-www-form-urlencoded; charset=utf-8;')
  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4 && __xhr.status == 200) {
      el.innerHTML=xhr.responseText
      body = el.getElementsByTagName('body')[0]
      head = el.getElementsByTagName('head')[0]
      if (scripts) {
        scripts.forEach((t) => {
          let node = document.createElement('script')
          node.type = "text/javascript"
          node.setAttribute('src', t)
          body.appendChild(node)
        })
      }
      if (css) {
        let node = document.createElement('link')
        node.setAttribute('rel', "stylesheet")
        node.setAttribute('href', css)
        head.appendChild(node)
      }
      document.write(__el.innerHTML)
      document.close()
    }
  }
  xhr.send()
}
