module.exports = function (str) {
  var verts = []
  var faces = []
  var lines = str.split('\n')
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]
    var toks = line.split(/\s+/)
    if (toks[0] === 'v') {
      var v = []
      for (var j = 1; j < toks.length; j++) {
        v.push(+toks[j])
      }
      verts.push(v)
    } else if (toks[0] === 'f') {
      var f = []
      for (var j = 1; j < toks.length; j++) {
        f.push((toks[j]-1)|0)
      }
      faces.push(f)
    }
  }
  return {
    positions: verts,
    cells: faces
  }
}
