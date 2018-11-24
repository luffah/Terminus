/* light dom manipulation and common type testing tool */
var dom = document
dom.Id = dom.getElementById
dom.El = dom.createElement
dom.Txt = dom.createTextNode

function prEl (root, tag, attrs) {
  var el = dom.El(tag)
  root.insertBefore(el, root.childNodes[0])
  var ty = typeof attrs
  if (attrs instanceof Object) { addAttrs(el, attrs) }
  else el.className = attrs 
  return el
}

function addEl (root, tag, attrs) {
  var el = dom.El(tag)
  if (attrs){
    if (attrs instanceof Object) { addAttrs(el, attrs) }
    else el.className = attrs
  }
  root.appendChild(el)
  return el
}
function span (content, cls) {
  return "<span  " + (cls ? " class='" + cls + "'" : '') + ">" + content + '</span>'
}
function tr (content) {
  return "<tr >" + content + '</tr>'
}
function td (content) {
  return "<td >" + content + '</td>'
}
function table (content) {
  return "<table >" + content + '</table>'
}
function addAttrs (el, attrs) {
  Object.keys(attrs).forEach(i => {
    if (attrs[i] instanceof Function){
      el[i] = attrs[i]
    } else {
      el.setAttribute(i, attrs[i])
    }
  })
  return el
}

function addBtn (root, clss, txt, title, fun) {
  var el = dom.El('button')
  if (def(clss)) { el.className = clss }
  if (def(title)) { el.title = title }
  if (def(txt)) { el.innerHTML = span(txt) }
  if (def(fun)) { el.onclick = fun }
  root.appendChild(el)
  return el
}
