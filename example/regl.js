var regl = require('regl')({
  extensions: [ 'oes_element_index_uint' ]
})
var camera = require('regl-camera')(regl, { distance: 50 })
var xhr = require('xhr')
var parse = require('../')

var draw = null

xhr({ url: '/teapot.bga', responseType: 'arraybuffer' }, onxhr)
function onxhr (err, res, body) {
  if (err || res.statusCode !== 200) return
  var start = performance.now()
  var mesh = parse(body)
  console.log('END',performance.now() - start)
  var attributes = {}
  var attrBuffer = regl.buffer({
    type: 'float32',
    data: mesh.data.vertex
  })
  mesh.header.attributes.forEach(function (attr) {
    attributes[attr.name] = {
      offset: attr.offset,
      stride: attr.stride,
      buffer: attrBuffer
    }
  })
  draw = regl({
    frag: `
      precision highp float;
      void main () {
        gl_FragColor = vec4(0,0.5,0.5,1);
      }
    `,
    vert: `
      precision highp float;
      uniform mat4 projection, view;
      attribute vec3 position;
      void main () {
        gl_Position = projection * view * vec4(position,1);
        gl_PointSize = 4.0;
      }
    `,
    attributes: attributes,
    elements: regl.elements({
      type: mesh.header.types.triangle,
      data: mesh.data.triangle
    })
  })
}

regl.frame(function () {
  regl.clear({ color: [1,1,1,1], depth: true })
  camera(function () {
    if (draw) draw()
  })
})
