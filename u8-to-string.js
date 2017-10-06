var Decoder = require('string_decoder').StringDecoder

module.exports = function (u8) {
  var sd = new Decoder
  return sd.end(Buffer.from(u8))
}
