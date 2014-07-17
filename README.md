# box-view-browser-bundle

A small module for making box-view API calls in a browser. Don't use this in production -- you should never expose your Box View API token to the client.

## Installation

```
npm install box-view-browser-bundle
```

## Usage

`bvbb(options, callback)`

```js
var bvbb = require('box-view-browser-bundle')

bvbb({
    port: 1234 // default - find an open port
  , serveStatic: true
  , cwd: process.cwd()
})
```

```html
<script src="box-view-browser-bundle.js"></script>
<script>
  var client = require('box-view')
  client.documents.list(function (err, res) {
    console.log(res)
  })
</script>
```

## Docs

### options

#### port

The port on which to serve the proxy (and optionally static files). Default: automatically find an open port.

#### serveStatic

Serve static files from the directory specified in `options.cwd`. Default: `true`.

#### cwd

The working directory to store the bundle and serve static files (if `serveStatic` is enabled). Default `process.cwd()`.

### callback

Callback function to call when the bundle has been compiled and server has started.

## License

([The MIT License](LICENSE))

Copyright 2014 Cameron Lakenen
