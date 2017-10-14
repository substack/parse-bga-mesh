var toStr = require('./u8-to-string.js')

var sizes = {
  float: 4, vec2: 8, vec3: 12, vec4: 16,
  mat2: 16, mat3: 36, mat4: 64,
  uint8: 1, uint16: 2, uint32: 4
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
  var m = /^BGA (.+)/.exec(lines[0])
  if (!m) throw new Error('magic number not found')
  var result = {
    version: m[1],
    endian: null,
    data: abuf,
    buffers: []
  }
  var counts = {}, offsets = {}, strides = {}
  var offset = dataOffset
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
        offsets[bufname] = offset
        strides[bufname] = 0
        offset += size
      }
      strides[bufname] += size
      result.buffers.push({
        type: type,
        name: bufname + '.' + varname,
        offset: offsets[bufname],
        stride: 0
      })
    } else if (m = re.count.exec(line)) {
      counts[m[2]] = Number(m[1])
    }
  }
  var len = result.buffers.length
  for (var i = 0; i < len; i++) {
    var b = result.buffers[i]
    var bufname = b.name.substr(0,b.name.indexOf('.'))
    b.stride = strides[bufname]
  }
  return result
}
