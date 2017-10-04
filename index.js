var sizes = {
  float: 4, vec2: 8, vec3: 12, vec4: 16,
  mat2: 16, mat3: 36, mat4: 64,
  uint16: 2, uint32: 4
}

function encode (str) {
  return Buffer.from(str).toString()
}

module.exports = function (abuf) {
  var data = new Uint8Array(abuf)
  for (var i = 1; i < data.length; i++) {
    if (data[i-1] === 0x0a && data[i] === 0x0a) {
      break
    }
  }
  var lines = encode(data.subarray(0,i-1)).split('\n')
  var m = /^BGA (.+)/.exec(lines[0])
  if (!m) throw new Error('magic number not found')
  var header = {
    version: m[1],
    attributes: [],
    types: { edge: 'uint16', triangle: 'uint16' },
    counts: { edge: 0, triangle: 0 }
  }
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i]
    if (m = /^(little|big) endian/.exec(line)) {
      header.endian = m[1]
    } else if (m = /^attribute (\w+) (\w+)$/.exec(line)) {
      header.attributes.push({ name: m[2], type: m[1] })
    } else if (m = /^(\d+) vertex$/.exec(line)) {
      header.counts.vertex = Number(m[1])
    } else if (m = /^(\d+) (edge|triangle) (uint16|uint32)$/.exec(line)) {
      header.counts[m[2]] = Number(m[1])
      header.types[m[2]] = m[3]
    }
  }
  var vsize = 0
  for (var i = 0; i < header.attributes.length; i++) {
    vsize += sizes[header.attributes[i].type]
  }
  var offsets = { attributes: i }
  var lengths = {
    vertex: header.counts.vertex * vsize,
    edges: header.counts.edge * sizes[header.types.edge],
    triangles: header.counts.triangle * sizes[header.types.triangle]
  }
  offsets.edges = offsets.attributes + lengths.attributes
  offsets.triangles = offsets.edges + lengths.edges
  return {
    header: header,
    data: {
      attributes: data.subarray(offsets.attributes, lengths.attributes),
      edges: data.subarray(offsets.edges, lengths.edges),
      triangles: data.subarray(offsets.triangles, lengths.triangles)
    }
  }
}
