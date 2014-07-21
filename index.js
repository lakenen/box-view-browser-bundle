'use strict';

var browserify = require('browserify')
  , boxview = require('box-view')
  , request = require('request')
  , envify = require('envify/custom')
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
  if (!opt.port) {
    require('portfinder').getPort(function (err, port) {
      if (err) {
        throw err
      }
      opt.port = port
      init(opt, callback)
    })
  } else {
    init(opt, callback)
  }
}

function init(opt, callback) {
  var b = browserify()
    , output = fs.createWriteStream(path.resolve(opt.cwd, BUNDLE_NAME))
    , baseURL = 'http://localhost:' + opt.port
    , env = {
        UPLOAD_URL: baseURL + '/upload'
      , DOCUMENTS_URL: baseURL + '/documents'
      , SESSIONS_URL: baseURL + '/sessions'
    }

  b.transform(envify(env))
  b.require(require.resolve('browser-request'), { expose: 'request' })
  b.require(require.resolve('box-view'), { expose: 'node-box-view' })
  b.require(require.resolve('./browser-box-view'), { expose: 'box-view' })
  b.bundle().pipe(output)

  output.on('finish', createServer)

  function handle(req, res) {
    var path = url.parse(req.url).path

    if (req.method === 'OPTIONS') {
      return proxy(null, req, res)
    }

    if (opt.token) {
      req.headers.Authorization = 'Token ' + opt.token
    }

    if (path.indexOf('/upload') === 0) {
      proxy(uploadsURL + path.replace('/upload', ''), req, res)
    } else if (path.indexOf('/documents') === 0) {
      proxy(documentsURL + path.replace('/documents', ''), req, res)
    } else if (path.indexOf('/sessions') === 0) {
      proxy(sessionsURL + path.replace('/sessions', ''), req, res)
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

  function createServer() {
    var server = http.createServer(handle).listen(opt.port, function () {
      if (typeof callback === 'function') {
        callback(opt.port, server)
      }
    })
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
  })
  req.pipe(r).pipe(res)
  r.on('error', function (err) {
    console.error(err)
  })
}

