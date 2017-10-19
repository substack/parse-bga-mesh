var xhr = require('xhr')
var parse = {
  bga: require('../'),
  obj: require('./lib/parse-obj.js'),
  gltf: require('./lib/parse-gltf.js'),
  json: JSON.parse
}
var xhrOpts = {
  bga: { responseType: 'arraybuffer' },
  gltf: {},
  obj: {},
  json: {}
}

var html = require('choo/html')
var app = require('choo')()
app.mount('body')

app.route('*', function (state) {
  return html`<body>
    <style>
    body {
      font-family: monospace;
    }
    .col {
      display: inline-block;
      width: 12ex;
    }
    .r {
      text-align: right;
    }
    </style>
    ${state.files.map(function (file) {
      var model = state.perf[file] || { results: {} }
      return state.formats.map(function (type) {
        return html`<div class="row">
          <div class="col">
            ${file}.${type}
          </div>
          ${(model.results[type] || []).map(function (time) {
            return html`<div class="col r">${time.toFixed(1)} ms</div>`
          })}
        </div>`
      })
    })}
  </body>`
})

app.use(function (state, emitter) {
  state.perf = []
  state.formats = ['bga','json','obj','gltf']
  state.files = ['Gemini','Mercury','MKIII','MMSEV','Z2']

  emitter.on('perf', function (perf) {
    var m = state.perf[perf.model]
    if (!m) {
      m = state.perf[perf.model] = {
        name: perf.model,
        results: {}
      }
    }
    if (!m.results[perf.type]) m.results[perf.type] = []
    m.results[perf.type].push(perf.time)
    emitter.emit('render')
  })

  ;(function nextFile (i) {
    if (i === state.files.length) return
    var file = state.files[i]
    ;(function nextFormat (j) {
      if (j === state.formats.length) return nextFile(i+1)
      var type = state.formats[j]
      var parser = parse[type]
      var opts = Object.assign({
        url: `/data/${file}.${type}`
      }, xhrOpts[type])
      xhr(opts, function (err, res, body) {
        if (err || res.statusCode !== 200) return
        ;(function nextTrial (k) {
          if (k === 5) return nextFormat(j+1)
          var start = performance.now()
          var mesh = parser(body)
          var elapsed = performance.now() - start
          emitter.emit('perf', {
            time: elapsed,
            type: type,
            model: file
          })
          window.requestIdleCallback(function () { nextTrial(k+1) })
        })(0)
      })
    })(0)
  })(0)
})
