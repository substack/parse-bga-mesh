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
  var mesh = parse(body)
  var buffer = regl.buffer({
    type: 'float32',
    data: body
  })
  draw = regl({
    frag: `
      precision highp float;
      varying vec3 vnorm;
      void main () {
        gl_FragColor = vec4(vnorm*0.5+0.5,1);
      }
    `,
    vert: `
      precision highp float;
      uniform mat4 projection, view;
      attribute vec3 position, normal;
      varying vec3 vnorm;
      void main () {
        vnorm = normal;
        gl_Position = projection * view * vec4(position,1);
        gl_PointSize = 4.0;
      }
    `,
    attributes: {
      position: {
        buffer: buffer,
        offset: mesh.data.vertex.position.offset,
        stride: mesh.data.vertex.position.stride
      },
      normal: {
        buffer: buffer,
        offset: mesh.data.vertex.normal.offset,
        stride: mesh.data.vertex.normal.stride
      }
    },
    count: mesh.data.triangle.cell.count * mesh.data.triangle.cell.quantity,
    elements: regl.elements({
      data: new Uint32Array(body, mesh.data.triangle.cell.offset,
        mesh.data.triangle.cell.count * mesh.data.triangle.cell.quantity),
      count: mesh.data.triangle.cell.count * 3
    })
  })
}

regl.frame(function () {
  regl.clear({ color: [1,1,1,1], depth: true })
  camera(function () {
    if (draw) draw()
  })
})
