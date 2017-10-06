var toStr = require('./u8-to-string.js')

var sizes = {
  float: 4, vec2: 8, vec3: 12, vec4: 16,
  mat2: 16, mat3: 36, mat4: 64,
  uint16: 2, uint32: 4
}

module.exports = function (abuf) {
  var data = new Uint8Array(abuf)
  for (var i = 1; i < data.length; i++) {
    if (data[i-1] === 0x0a && data[i] === 0x0a) {
      break
    }
  }
  var offsets = { vertex: i+1 }
  var lines = toStr(data.subarray(0,i-1)).split('\n')
  var m = /^BGA (.+)/.exec(lines[0])
  if (!m) throw new Error('magic number not found')
  var header = {
    version: m[1],
    attributes: [],
    types: { edge: 'uint16', triangle: 'uint16' },
    counts: { vertex: 0, edge: 0, triangle: 0 }
  }
  var stride = 0
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i]
    if (m = /^(little|big) endian/.exec(line)) {
      header.endian = m[1]
    } else if (m = /^attribute (\w+) (\w+)$/.exec(line)) {
      var name = m[2], type = m[1]
      var size = sizes[type]
      header.attributes.push({
        name: name,
        type: type,
        size: size
      })
      stride += size
    } else if (m = /^(\d+) vertex$/.exec(line)) {
      header.counts.vertex = Number(m[1])
    } else if (m = /^(\d+) (edge|triangle) (uint16|uint32)$/.exec(line)) {
      header.counts[m[2]] = Number(m[1])
      header.types[m[2]] = m[3]
    }
  }
  var attrOffset = 0
  for (var i = 0; i < header.attributes.length; i++) {
    var attr = header.attributes[i]
    attr.offset = attrOffset
    attrOffset += attr.size
    attr.stride = stride
  }
  var vsize = 0
  for (var i = 0; i < header.attributes.length; i++) {
    vsize += sizes[header.attributes[i].type]
  }
  var byteLengths = {
    vertex: header.counts.vertex * vsize,
    edge: header.counts.edge * sizes[header.types.edge],
    triangle: header.counts.triangle * sizes[header.types.triangle]
  }
  offsets.edge = offsets.vertex + byteLengths.vertex
  offsets.triangle = offsets.edge + byteLengths.edge

  var rdata = {
    vertex: new Uint8Array(
      data.buffer, offsets.vertex, header.counts.vertex * vsize)
  }
  if (header.types.edge === 'uint16') {
    rdata.edge = new Uint16Array(
      rdata.buffer, offsets.edge, header.counts.edge*2)
  } else if (header.types.edge === 'uint32') {
    rdata.edge = new Uint32Array(
      data.buffer, offsets.edge, header.counts.edge*2)
  } else {
    throw new Error('unsupported edge type ' + header.types.edge)
  }
  if (header.types.triangle === 'uint16') {
    rdata.triangle = new Uint16Array(
      data.buffer, offsets.triangle, header.counts.triangle*3)
  } else if (header.types.triangle === 'uint32') {
    rdata.triangle = new Uint32Array(
      data.buffer, offsets.triangle, header.counts.triangle*3)
  } else {
    throw new Error('unsupported triangle type ' + header.types.triangle)
  }
  return {
    header: header,
    data: rdata
  }
}
