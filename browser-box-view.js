var boxview = require('node-box-view')

module.exports = {
  createClient: function (token) {
    var client = boxview.createClient(token, { withCredentials: false })
    client.documentsUploadURL = process.env.UPLOAD_URL
    client.documentsURL = process.env.DOCUMENTS_URL
    client.sessionsURL = process.env.SESSIONS_URL
    return client
  }
}
