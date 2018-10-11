var tree = dom.El('div')
tree.className = 'tree'

function autoexplore (room) {
  var branchcontainer = dom.El('div')
  var branchtitle = dom.El('div')
  branchtitle.innerText = room.name
  var branch = dom.El('div')
  branchcontainer.appendChild(branchtitle)
  branch.className = 'branch'
  var i
  for (i = 0; i < room.children.length; i++) {
    branch.appendChild(autoexplore(room.children[i]))
  }
  if (i > 0) {
    branchcontainer.appendChild(branch)
  }
  return branchcontainer
}
tree.appendChild(autoexplore($home))
dom.body.appendChild(tree)
