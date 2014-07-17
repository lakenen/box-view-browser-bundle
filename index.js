'use strict';

var http = require('http')
  , request = require('hyperquest')
  , url = require('url')
  , boxview = require('box-view')
  , browserify = require('browserify')
  , envify = require('envify/custom')
  , fs = require('fs')
  , Static = require('node-static').Server

var uploadsURL = process.env.BOX_VIEW_DOCUMENTS_UPLOAD_URL || boxview.DOCUMENTS_UPLOAD_URL
  , documentsURL = process.env.BOX_VIEW_DOCUMENTS_URL || boxview.DOCUMENTS_URL
  , sessionsURL = process.env.BOX_VIEW_SESSIONS_URL || boxview.SESSIONS_URL

module.exports = function (opt) {
  opt = opt || {}
  if (!opt.port) {
    require('portfinder').getPort(function (err, port) {
      if (err) {
        throw err
      }
      opt.port = port
      init(opt)
    })
  } else {
    init(opt)
  }
}

function init(opt) {
  var b = browserify()
    , output = fs.createWriteStream('bundle.js')
    , files = opt.serveStatic && new Static()
    , baseURL = 'http://localhost:' + opt.port
    , env = {
        API_TOKEN: process.env.BOX_VIEW_API_TOKEN
      , UPLOAD_URL: baseURL + '/upload'
      , DOCUMENTS_URL: baseURL + '/documents'
      , SESSIONS_URL: baseURL + '/sessions'
    }

  b.transform(envify(env))
  b.require(require.resolve('browser-request'), { expose: 'request' })
  b.require(require.resolve('box-view'), { expose: 'node-box-view' })
  b.require('./browser-box-view.js', { expose: 'box-view' })
  b.bundle().pipe(output)

  output.on('finish', createServer)

  function createServer() {
    http.createServer(function (req, res) {
      var path = url.parse(req.url).path

      if (path.indexOf('/upload') === 0) {
        proxy(uploadsURL + path.replace('/upload', ''), req, res)
      } else if (path.indexOf('/documents') === 0) {
        proxy(documentsURL + path.replace('/documents', ''), req, res)
      } else if (path.indexOf('/sessions') === 0) {
        proxy(sessionsURL + path.replace('/sessions', ''), req, res)
      } else {
        // serve up static file
        if (files) {
          files.serve(req, res)
        } else {
          res.end()
        }
      }

    }).listen(opt.port, function () {
      console.log('listening on %s', opt.port)
    })
  }
}

function proxy(uri, req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  // required for GET/HEAD requests, they otherwise would not pipe properly
  if (req.method === 'GET') {
    req.headers['Transfer-Encoding'] = 'chunked'
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

