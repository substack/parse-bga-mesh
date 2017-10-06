# parse-bga-mesh

parse a [bga mesh][]

[bga mesh]: https://substack.neocities.org/bga.html

# example

```
var parse = require('parse-bga-mesh')
var fs = require('fs')
var buf = fs.readFileSync(process.argv[2])
var mesh = parse(buf.buffer.slice(0,buf.length))
console.log(mesh)
```

output:

```
$ node example/parse.js example/teapot.bga
{ header: 
   { version: '1.0',
     attributes: [ { name: 'position', type: 'vec3', size: 12, offset: 0, stride: 12 } ],
     types: { edge: 'uint16', triangle: 'uint16' },
     counts: { vertex: 792, edge: 0, triangle: 992 },
     endian: 'little' },
  data: 
   { vertex: Uint8Array [...],
     edge: Uint8Array [  ],
     triangle: Uint8Array [...]
    } }
```

# api

```
var parse = require('parse-bga-mesh')
```

## var mesh = parse(arraybuffer)

Parse a mesh given an `arraybuffer` of BGA content.

In the browser, to load a file over HTTP as an array buffer, make an
xhr request with `responseType: 'arraybuffer'`.

This operation is very fast. It should take a few milliseconds at most.

The `mesh` object has these properties:

* mesh.header.version - version number of the file
* mesh.header.attributes - array of attribute info (see below)
* mesh.header.types.edge - edge data type (`'uint16'` or `'uint32'`)
* mesh.header.types.triangle - triangle data type (`'uint16'` or `'uint32'`)
* mesh.header.counts.vertex - number of vertices
* mesh.header.counts.edge - number of edges
* mesh.header.counts.triangle - number of triangles
* mesh.header.endian - endianness: `'big'` or `'little'`
* mesh.data.vertex - Uint8Array of vertex data
* mesh.data.edge - Uint8Array of edge data
* mesh.data.triangle - Uint8Array of triangle data

Each `attribute` in the `mesh.header.attributes` array contains:

* attribute.name - name of the vertex attribute
* attribute.type - glsl type (float, vec2, vec3, etc)
* attribute.size - size of each item in bytes
* attribute.offset - byte offset into the mesh.data.vertex Uint8Array
* attribute.stride - how many bytes to skip between items

# install

```
npm install parse-bga-mesh
```

# license

BSD
