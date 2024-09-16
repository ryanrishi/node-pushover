var fs = require('fs')
var https = require('https')
var http = require('http')
var url = require('url')
var qs = require('querystring')
var pUrl = 'https://api.pushover.net/1/messages.json'
var path = require('path')

/**
 * Sets default values for missing properties in the object.
 * @param {object} o - The object containing optional properties.
 * @returns {object} The object with default properties set.
 */
function setDefaults (o) {
  var def = [
    'device',
    'title',
    'url',
    'url_title',
    'priority',
    'timestamp',
    'sound'
  ]

  var i = 0
  var l = def.length
  for (; i < l; i++) {
    if (!o[def[i]]) {
      o[def[i]] = ''
    }
  }

  return o
}

/**
 * Loads an image from the specified file path.
 * @param {string} imgPath - The file path of the image to load.
 * @returns {object} An object containing the image name and data.
 */
function loadImage(imgPath) {
  var o = {}
  o.name = path.basename(imgPath)
  o.data = fs.readFileSync(imgPath)
  return o
}


/**
 * Converts a request string into a multipart form-data payload.
 * @param {string} rs - The request string to convert.
 * @param {string} b - The boundary string used for multipart form-data.
 * @param {object} [imgObj] - The optional image object containing the image data and metadata.
 * @returns {Buffer} The multipart payload as a Buffer object.
 */
function reqString2MP(rs, b, imgObj) {
  var a = []
  var parts = []
  var o = qs.parse(rs)

  a.push(b)

  for (var p in o) {
    if (o[p] !== '') {
      a.push('Content-Disposition: form-data; name="' + p + '"')
      a.push("")
      a.push(o[p])
      a.push(b)
    }
  }

  if (imgObj) {
    a.push('Content-Disposition: form-data; name="attachment"; filename="' + imgObj.name + '"')
    if (imgObj.hasOwnProperty('type')) {
      a.push('Content-Type: ' + imgObj.type)
    } else {
      a.push('Content-Type: application/octet-stream')
    }
    a.push('')
    a.push('')
  } else {
    a.splice(-1, 1)
  }

  var payload
  if (imgObj) {
    payload = Buffer.concat([
      Buffer.from(a.join('\r\n'), 'utf8'),
      Buffer.from(imgObj.data, 'binary'),
      Buffer.from('\r\n' + b + '--\r\n', 'utf8')
    ])
  } else {
    payload = Buffer.concat([
      Buffer.from(a.join('\r\n'), 'utf8'),
      Buffer.from(b + '--\r\n', 'utf8')
    ])
  }
  return payload
}

/**
 * Creates a new Pushover instance.
 * @class
 * @param {object} opts - The options for Pushover.
 * @param {string} opts.token - The Pushover API token.
 * @param {string} opts.user - The user key for sending messages.
 * @param {object} [opts.httpOptions] - Optional HTTP options.
 * @param {boolean} [opts.debug] - Enable debug logging.
 * @param {function} [opts.onerror] - Custom error handler.
 * @param {boolean} [opts.update_sounds] - Automatically update sounds.
 */
function Pushover (opts) {
  var self = this
  this.boundary = "--" + Math.random().toString(36).substring(2)
  this.token = opts.token
  this.user = opts.user
  this.httpOptions = opts.httpOptions
  this.sounds = {
    'pushover': 'Pushover (default)',
    'bike': 'Bike',
    'bugle': 'Bugle',
    'cashregister': 'Cash Register',
    'classical': 'Classical',
    'cosmic': 'Cosmic',
    'falling': 'Falling',
    'gamelan': 'Gamelan',
    'incoming': 'Incoming',
    'intermission': 'Intermission',
    'magic': 'Magic',
    'mechanical': 'Mechanical',
    'pianobar': 'Piano Bar',
    'siren': 'Siren',
    'spacealarm': 'Space Alarm',
    'tugboat': 'Tug Boat',
    'alien': 'Alien Alarm (long)',
    'climb': 'Climb (long)',
    'persistent': 'Persistent (long)',
    'echo': 'Pushover Echo (long)',
    'updown': 'Up Down (long)',
    'none': 'None (silent)'
  }

  if (opts.debug) {
    this.debug = opts.debug
  }

  if (opts.onerror) {
    this.onerror = opts.onerror
  }

  if (opts.update_sounds) {
    self.updateSounds()
    setInterval(function () {
      self.updateSounds()
    }, 86400000)
  }
}


/**
 * Handles errors from Pushover API responses.
 * @param {string|object} d - The response data from the API.
 * @param {object} res - The HTTP response object.
 * @throws {Error} Throws an error if there are API errors and no error handler is provided.
 */
Pushover.prototype.errors = function (d, res) {
  if (typeof d === 'string') {
    try {
      d = JSON.parse(d)
    } catch (error) {
      this.onerror(error, res)
    }
  }

  if (d.errors) {
    if (this.onerror) {
      this.onerror(d.errors[0], res)
    } else {
      // If no onerror was provided throw our error
      throw new Error(d.errors[0], res)
    }
  }
}

/**
 * Updates the list of available Pushover sounds.
 */
Pushover.prototype.updateSounds = function () {
  var self = this
  var data = ''
  var surl = 'https://api.pushover.net/1/sounds.json?token=' + self.token
  var req = https.request(url.parse(surl), function (res) {
    res.on('end', function () {
      try {
        var j = JSON.parse(data)
        self.errors(data, res)
        self.sounds = j.sounds
      } catch (error) {
        self.errors('Pushover: parsing sound data failed', res)
      }
    })

    res.on('data', function (chunk) {
      data += chunk
    })
  })

  req.on('error', function (e) {
    self.errors(e)
  })

  req.write('')
  req.end()
}

/**
 * Sends a message using Pushover.
 * @param {Message} obj - The message to send.
 * @param {PushoverCallback} fn - The callback function that handles the response.
 */
Pushover.prototype.send = function (obj, fn) {
  var self = this
  var o = url.parse(pUrl)
  var proxy
  o.method = 'POST'

  obj = setDefaults(obj)

  var reqString = {
    token: self.token || obj.token,
    user: self.user || obj.user
  }

  var p
  for (p in obj) {
    if (obj[p] !== '') {
      if (p !== 'file') {
        reqString[ p ] = obj[p]
      }
    }
  }

  reqString = qs.stringify(reqString)

  var mp
  if (obj.file) {
    if (typeof obj.file === 'string') {
      mp = reqString2MP(reqString, self.boundary, loadImage(obj.file))
    }
    if (typeof obj.file === 'object') {
      mp = reqString2MP(reqString, self.boundary, obj.file)
    }
  } else {
    mp = reqString2MP(reqString, self.boundary)
  }

  o.headers = {
    'Content-type': 'multipart/form-data; boundary=' + self.boundary.substring(2),
    'Content-Length': mp.length
  }

  var httpOpts = self.httpOptions || {}
  if (httpOpts) {
    Object.keys(httpOpts).forEach(function (key) {
      if (key !== 'proxy') {
        o[key] = httpOpts[key]
      }
    })
  }

  if (httpOpts.hasOwnProperty('proxy') && httpOpts.proxy && httpOpts.proxy !== '') {
    proxy = url.parse(httpOpts.proxy)
    o.headers.Host = o.host
    o.host = proxy.hostname
    o.protocol = proxy.protocol
  }

  var request
  if ((httpOpts.proxy && httpOpts.proxy !== '') || pUrl.match(/http:/)) {
    request = http.request
  } else {
    request = https.request
  }

  var req = request(o, function (res) {
    if (self.debug) {
      console.log(res.statusCode)
    }
    var err
    var data = ''
    res.on('end', function () {
      self.errors(data, res)
      if (fn) {
        fn(err, data, res)
      }
    })

    res.on('data', function (chunk) {
      data += chunk
    })
  })

  req.on('error', function (err) {
    if (fn) {
      fn(err)
    }
    // In the tests the "end" event did not get emitted if "error" was emitted,
    // but to be sure that the callback is not called twice, null the callback function
    fn = null
  })

  if (self.debug) {
    console.log(reqString.replace(self.token, 'XXXXX').replace(self.user, 'XXXXX'))
  }

  req.write(mp)
  req.end()
}

/**
 * A callback function that handles the result of the Pushover send operation.
 * @callback PushoverCallback
 * @param {Error|null} error - The error object if the operation failed, or null if successful.
 * @param {any} result - The result of the operation, can be any type.
 */

/**
 * @typedef {Object} Message
 * @property {string} message - The message to send
 * @property {string} [token] - The API token.
 * @property {string} [user] - The user key.
 * @property {string|object} [file] - A file path or binary image attachment to send with the message
 * @property {string} [device] - The name of one of your devices to send just to that device instead of all devices
 * @property {string} [html] - Set to 1 to enable HTML parsing
 * @property {string} [priority] - A value of -2, -1, 0 (default), 1, or 2
 * @property {string} [sound] - The name of a supported sound to override your default sound choice
 * @property {string} [timestamp] - A Unix timestamp of a time to display instead of when our API received it
 * @property {string} [title] - Your message's title, otherwise your app's name is used
 * @property {string} [ttl] - A number of seconds that the message will live, before being deleted automatically
 * @property {string} [url] - A supplementary URL to show with your message
 * @property {string} [url_title] - A title for the URL specified as the url parameter, otherwise just the URL is shown
 */

exports = module.exports = Pushover
