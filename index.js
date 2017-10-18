var toStr = require('./u8-to-string.js')

var sizes = {
  float: 4, vec2: 8, vec3: 12, vec4: 16,
  mat2: 16, mat3: 36, mat4: 64,
  uint8: 1, uint16: 2, uint32: 4,
  int8: 1, int16: 2, int32: 4
}
var btypes = {
  float: 'float', vec2: 'float', vec3: 'float', vec4: 'float',
  mat2: 'float', mat3: 'float', mat4: 'float',
  uint8: 'uint8', uint16: 'uint16', uint32: 'uint32'
}
var qtypes = {
  float: 1, vec2: 2, vec3: 3, vec4: 4,
  mat2: 4, mat3: 9, mat4: 16,
  uint8: 1, uint16: 1, uint32: 1
}

var re = {
  version: /^2\./,
  endian: /^(little|big) endian\s*(?:$|\/\/)/,
  type: /^([a-z]\w*)\s+(\w+)\.(\w+)\s*(\[\d+\])?\s*(?:$|\/\/)/,
  count: /^(\d+) (\S+)\s*(?:$|\/\/)/
}

module.exports = function (abuf) {
  var data = new Uint8Array(abuf)
  for (var i = 1; i < data.length; i++) {
    if (data[i-1] === 0x0a && data[i] === 0x0a) {
      break
    }
  }
  var dataOffset = i+1
  var lines = toStr(data.subarray(0,i-1)).split('\n')
  var m = /^BGA (\S+)/.exec(lines[0])
  if (!m) throw new Error('magic number not found')
  var result = {
    version: m[1],
    endian: null,
    data: {}
  }
  var counts = {}, offsets = {}, strides = {}
  var bufnames = [], varnames = {}
  if (!re.version.test(result.version)) {
    throw new Error('only version 2.x supported, found: ' + result.version)
  }
  var stride = 0
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i]
    if (m = re.endian.exec(line)) {
      result.endian = m[1]
    } else if (m = re.type.exec(line)) {
      var type = m[1]
      var bufname = m[2]
      var varname = m[3]
      var quantity = m[4] === undefined
        ? 1 : Number(m[4].substring(1,m[4].length-1))
      var size = sizes[type] * quantity
      if (!offsets.hasOwnProperty(bufname)) {
        offsets[bufname] = dataOffset
        strides[bufname] = 0
        bufnames.push(bufname)
        varnames[bufname] = []
        result.data[bufname] = {}
      }
      strides[bufname] += size
      varnames[bufname].push(varname)
      result.data[bufname][varname] = {
        type: btypes[type],
        quantity: quantity * qtypes[type],
        offset: offsets[bufname],
        stride: 0
      }
      offsets[bufname] += size
    } else if (m = re.count.exec(line)) {
      counts[m[2]] = Number(m[1])
    }
  }
  var offset = 0
  for (var i = 0; i < bufnames.length; i++) {
    var bufname = bufnames[i]
    var vnames = varnames[bufname]
    var size = 0, factor = 1
    var b
    for (var j = 0; j < vnames.length; j++) {
      var varname = vnames[j]
      b = result.data[bufname][varname]
      b.stride = strides[bufname]
      b.count = counts[bufname]
      b.offset += offset
      factor = flcm(factor,sizes[b.type])
      size += sizes[b.type] * b.count * b.quantity
    }
    b = result.data[bufname][vnames[0]]
    var pad = (factor - (b.offset % factor)) % factor
    for (var j = 0; j < vnames.length; j++) {
      var varname = vnames[j]
      b = result.data[bufname][varname]
      b.offset += pad
    }
    offset += size + pad
  }
  return result
}

function flcm (a, b) { return Math.max(a,b) }
