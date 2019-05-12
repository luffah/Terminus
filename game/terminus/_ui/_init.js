var state = new GameState()
var vt = new VTerm(dom.Id('term'))
vt.imgbank = new Images(RES.img)

window.addEventListener('load', Game)
function Game () {
  let g = Game.prototype
  g.version = CREDITS.game.version
  g.title = CREDITS.game.title
  loadBackgroud('init')
  if (typeof doTest === 'function') {
    doTest(vt)
    return
  }
  g.hasSave = state.startCookie(g.title + g.version)
  g.start(vt, 0)
  // t.menu()
  // new Seq([t.demo_note, t.menu]).next()
}
