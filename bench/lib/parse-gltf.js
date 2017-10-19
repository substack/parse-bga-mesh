var GLTF = require('./minimal-gltf-loader.js').glTFLoader

module.exports = function (str) {
  var g = new GLTF
  return g.parse(str)
}
