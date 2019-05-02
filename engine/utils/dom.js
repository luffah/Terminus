/* light dom manipulation and common type testing tool */
const dom = document
dom.Id = dom.getElementById
dom.El = dom.createElement
dom.Txt = dom.createTextNode

function prEl (root, tag, attrs) {
  let el = dom.El(tag)
  root.insertBefore(el, root.childNodes[0])
  return addAttrs(el, attrs)
}

function addEl (root, tag, attrs) {
  let el = dom.El(tag)
  root.appendChild(el)
  return addAttrs(el, attrs)
}

function overclass (a) {
  let cls = a.replace(/[^a-zA-Z0-9]/g, '-')
  let t = cls.split('-')
  return 't-' + t[0] + (t.length > 1 ? ' t-' + t[0] + '-' + t[1] + (t.length > 2 ? ' t-' + cls : '') : '')
}

function span (content, cls) {
  return '<span' + (cls ? " class='" + cls + "'" : '') + '>' + content + '</span>'
}

// function div (content, cls) {
//   return '<div' + (cls ? " class='" + cls + "'" : '') + '>' + content + '</div>'
// }

function table (tab, cls) {
  return '<table' + (cls ? " class='" + cls + "'" : '') + '>' + tab.map(
    i => '<tr>' + i.map(j => '<td>' + j + '</td>'
    ).join('') + '</tr>').join('') + '</table>'
}

function ul (tab, cls) {
  return '<ul' + (cls ? " class='" + cls + "'" : '') + '>' + tab.map(
    i => '<li>' + i + '</li>').join('') + '</ul>'
}

function img (src, title, legend) {
  let i = '<img src="' + src + '" title="' + title + '"/>'
  return legend ? '<figure>' + i + '<figcaption>' + legend + '</figcaption>' + '</figure>' : i
}

function addAttrs (el, attrs) {
  if (attrs) {
    if (attrs instanceof Object) {
      keys(attrs).forEach(i => {
        if (attrs[i] instanceof Function) {
          el[i] = attrs[i]
        } else {
          el.setAttribute(i, attrs[i])
        }
      })
    } else el.className = attrs
  }
  return el
}

function addBtn (root, clss, txt, title, fun) {
  var el = dom.El('button')
  if (clss) { el.className = clss }
  if (title) { el.title = title }
  if (txt) { el.innerHTML = span(txt) }
  if (fun) { el.onclick = fun }
  root.appendChild(el)
  return el
}
