const desktop = dom.Id('desktop')
vt.on('ReturnStatement', function (ret) {
  if (ret.render) {
    if (ret.render instanceof File) {
      if (ret.render.bgimg) {
        desktop.style['background-image'] = ret.render.bgimg
      }
      if (ret.render.bgcolor) {
        desktop.style['background-color'] = ret.render.bgcolor
      }
    } else {
      desktop.style['background-color'] = '#000'
      desktop.style['background-image'] = 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0))'
    }
  }
})
function loadBackgroud (step) {
}
function showBackground () {
  desktop.style['background-color'] = '#000'
  desktop.style['background-image'] = 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0))'
}
