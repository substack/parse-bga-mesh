var g = 'g'.charCodeAt(0)
var l = 'l'.charCodeAt(0)
var T = 'T'.charCodeAt(0)
var F = 'F'.charCodeAt(0)
var td = new TextDecoder('utf8')
var GLTF = require('./minimal-gltf-loader.js').glTFLoader

module.exports = function (abuf) {
  var data = new Uint8Array(abuf)
  var dv = new DataView(abuf)
  if (data[0] !== g || data[1] !== l || data[2] !== T || data[3] !== F) {
    throw new Error('magic number mismatch')
  }
  var version = dv.getUint32(4, true)
  if (version !== 0x02) {
    throw new Error('only glTF version 2 supported')
  }
  var length = dv.getUint32(8, true)
  var contentLength = dv.getUint32(12, true)
  var contentFormat = dv.getUint32(16, true)
  /*if (contentFormat !== 0x00) {
    throw new Error('only json content format is supported')
  }*/
  var contentData = td.decode(data.subarray(20,20+contentLength))
  var header = JSON.parse(contentData)
  var gl = new GLTF
  return gl.fromBinary(header, data.subarray(20+contentLength, length-20))
}
