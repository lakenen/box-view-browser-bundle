# box-view-browser-bundle

A small module for making box-view API calls in a browser.

**Warning** - you shouldn't expose your production Box View API token to the client.

## Installation

```
npm install box-view-browser-bundle
```

## Usage

`bvbb(options, callback)`

```js
var bvbb = require('box-view-browser-bundle')

bvbb({
    port: 1234
  , token: process.env.BOX_VIEW_API_TOKEN
})
```

```html
<script src="box-view-browser-bundle.js"></script>
<script>
  var client = require('box-view').createClient()
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

#### token

Optionally specify the Box View token to overwrite the Authorization header that is sent to the View API (this option can be used to avoid exposing the token to the client).

#### expose

Optionally specify the Box View module name to expose in the bundle. Default: `'box-view'`.

#### bundler

Optionally specify a function that accepts a function as an argument, which should be passed an instance of some browserify-like object, and returns a stream (if options.output !== false).

Default:
```js
function bundler(fn) {
  var b = browserify()
  fn(b)
  return b.bundle()
}
```

#### output

Specify an output filename or stream to write the bundle to. Default: `opt.cwd + '/box-view-browser-bundle.js'`.

### callback

Callback function to call when the bundle has been compiled and server has started.

## License

([The MIT License](LICENSE))

Copyright 2014 Cameron Lakenen
