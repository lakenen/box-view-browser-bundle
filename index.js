'use strict';

var browserify = require('browserify')
  , boxview = require('box-view')
  , request = require('request')
  , envify = require('envify/custom')
  , extend = require('extend')
  , send = require('send')
  , http = require('http')
  , path = require('path')
  , url = require('url')
  , fs = require('fs')

var BUNDLE_NAME = 'box-view-browser-bundle.js'

var uploadsURL = process.env.BOX_VIEW_DOCUMENTS_UPLOAD_URL || boxview.DOCUMENTS_UPLOAD_URL
  , documentsURL = process.env.BOX_VIEW_DOCUMENTS_URL || boxview.DOCUMENTS_URL
  , sessionsURL = process.env.BOX_VIEW_SESSIONS_URL || boxview.SESSIONS_URL

module.exports = function (opt, callback) {
  opt = opt || {}
  opt.cwd = path.resolve(opt.cwd || process.cwd())
  opt.serveStatic = ('serveStatic' in opt) ? opt.serveStatic : true
  opt.serve = opt.serve || true

  if (opt.serve || opt.serveStatic) {
    if (!opt.port || !opt.url) {
      require('portfinder').getPort(function (err, port) {
        if (err) {
          throw err
        }
        opt.port = port
        bundleScripts(opt, createServer.bind(null, opt, callback))
      })
    } else {
      bundleScripts(opt, createServer.bind(null, opt, callback))
    }
  } else {
    bundleScripts(opt, function () {
      callback(createHandler(opt))
    })
  }
}
module.exports.bundle = bundleScripts
module.exports.createHandler = createHandler

function bundleScripts(opt, callback) {
  opt.output = ('output' in opt) ? opt.output : true
  opt.bundler = opt.bundler || bundler

  var bundle
    , output
    , baseURL = opt.url || 'http://localhost:' + opt.port
    , env = {
        UPLOAD_URL: baseURL + '/upload'
      , DOCUMENTS_URL: baseURL + '/documents'
      , SESSIONS_URL: baseURL + '/sessions'
    }

  if (opt.output !== false) {
    if (opt.output === true) {
      opt.output = path.resolve(opt.cwd, BUNDLE_NAME)
    }
    if (typeof opt.output === 'string') {
      output = fs.createWriteStream(opt.output)
    } else if (opt.output.writable) {
      output = opt.output
    }
  }

  bundle = opt.bundler(function (b) {
    b.transform(envify(env))
    b.require(require.resolve('box-view'), { expose: 'node-box-view' })
    b.require(require.resolve(__dirname + '/browser-box-view'), { expose: opt.expose || 'box-view' })
  })

  if (output && bundle) {
    bundle.pipe(output)
    output.on('finish', callback)
  }
}

function bundler(fn) {
  var b = browserify()
  fn(b)
  return b.bundle()
}

function createServer(opt, callback) {
  var handler = createHandler(opt)
  var server = http.createServer(handler).listen(opt.port, function () {
    if (typeof callback === 'function') {
      callback(opt.port, server)
    }
  })
}

function createHandler(opt) {
  var base = opt.url ? url.parse(opt.url).path : ''
    , upload  = base + '/upload'
    , documents = base + '/documents'
    , sessions = base + '/sessions'
  return function handleRequest(req, res) {
    var path = url.parse(req.url).path

    if (req.method === 'OPTIONS') {
      return proxy(null, req, res)
    }

    if (opt.token) {
      req.headers.authorization = 'token ' + opt.token
    }

    delete req.headers.host
    delete req.headers.origin
    delete req.headers.referer
    delete req.headers['user-agent']

    extend(req.headers, opt.headers || {})

    if (path.indexOf(upload) === 0) {
      proxy(uploadsURL + path.replace(upload, ''), req, res)
    } else if (path.indexOf(documents) === 0) {
      proxy(documentsURL + path.replace(documents, ''), req, res)
    } else if (path.indexOf(sessions) === 0) {
      proxy(sessionsURL + path.replace(sessions, ''), req, res)
    } else {
      // serve up static file
      if (opt.serveStatic) {
        send(req, req.url, { root: opt.cwd }).pipe(res)
      } else {
        res.writeHead(404, { 'content-type': 'text/plain' })
        res.write('not found :(\n')
        res.end()
      }
    }
  }
}

function proxy(uri, req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'origin,authorization,accept,content-type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  if (!uri) {
    return res.end()
  }
  var r = request(uri, {
      method: req.method
    , headers: req.headers
    , timeout: 30000
  })

  function onerror(err) {
    console.error(err)
    try {
      res.writeHead(500)
      res.end()
    } catch (err) {}
  }

  req.pipe(r).pipe(res)
  r.on('error', onerror)
}

