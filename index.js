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
  var offsets = { vertex: i+1 }
  var lines = encode(data.subarray(0,i-1)).split('\n')
  var m = /^BGA (.+)/.exec(lines[0])
  if (!m) throw new Error('magic number not found')
  var header = {
    version: m[1],
    attributes: [],
    types: { edge: 'uint16', triangle: 'uint16' },
    counts: { edge: 0, triangle: 0 }
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
  var lengths = {
    vertex: header.counts.vertex * vsize,
    edge: header.counts.edge * sizes[header.types.edge],
    triangle: header.counts.triangle * sizes[header.types.triangle]
  }
  offsets.edge = offsets.vertex + lengths.vertex
  offsets.triangle = offsets.edge + lengths.edge
  return {
    header: header,
    data: {
      vertex: data.subarray(
        offsets.vertex, offsets.vertex + lengths.vertex),
      edge: header.types.edge
        ? toarray(header.types.edge,
            data.subarray(offsets.edge, offsets.edge + lengths.edge))
        : [],
      triangle: header.types.triangle
        ? toarray(header.types.triangle,
            data.subarray(offsets.triangle,
              offsets.triangle + lengths.triangle))
        : []
    }
  }
}

function toarray (type, data) {
  if (type === 'uint16') return new Uint16Array(data.buffer)
  if (type === 'uint32') return new Uint32Array(data.buffer)
  throw new Error('unexpected type ' + type)
}
