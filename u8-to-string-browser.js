var td = new TextDecoder('utf8')

module.exports = function (u8) {
  return td.decode(u8)
}
