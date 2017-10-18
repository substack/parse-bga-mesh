# parse-bga-mesh

parse a [bga mesh][]

[bga mesh]: https://substack.neocities.org/bga.html

# example

```
var parse = require('parse-bga-mesh')
var fs = require('fs')
var buf = fs.readFileSync(process.argv[2])
var mesh = parse(buf.buffer.slice(0,buf.length))
console.log(JSON.stringify(mesh,null,2))
```

output:

```
$ node example/parse.js example/teapot.bga
{
  "version": "2.0",
  "endian": "little",
  "data": {
    "vertex": {
      "position": {
        "type": "float",
        "quantity": 3,
        "offset": 112,
        "stride": 24,
        "count": 792
      },
      "normal": {
        "type": "float",
        "quantity": 3,
        "offset": 124,
        "stride": 24,
        "count": 792
      }
    },
    "triangle": {
      "cell": {
        "type": "uint32",
        "quantity": 3,
        "offset": 19120,
        "stride": 12,
        "count": 992
      }
    }
  }
}
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

* mesh.version - version number of the file
* mesh.header.endian - endianness: `'big'` or `'little'`
* mesh.data - object mapping buffer names to property names (see below)

Each property value in `mesh.data` should have:

* prop.type - one of: float, uint8, uint16, uint32, int8, int16, int32
* prop.quantity - number of contiguous items in each record
* prop.offset - starting byte offset into the array buffer
* prop.stride - number of bytes between records
* prop.count - number of records

# install

```
npm install parse-bga-mesh
```

# license

BSD
