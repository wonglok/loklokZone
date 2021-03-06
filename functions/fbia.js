var functions = require('firebase-functions')
const express = require('express')

const webpacker = require('./webpacker').webpacker

const config = require('./config.js').config
// const convertToFbia = require('article-json-to-fbia')
// var Handlebars = require('handlebars')

var fs = require('fs')
var path = require('path')
var appHTML = fs.readFileSync(path.resolve(__dirname, './dist/index.html'), 'utf8')

const app = express()
const cors = require('cors')({origin: true})
app.use(cors)

var composeMetaTags = ({ req, res }) => {
  return new Promise((resolve, reject) => {
    resolve(
      ``
    )
  })
}

var composeAppDiv = ({ req, res }) => {
  return new Promise((resolve, reject) => {
    var result = ``
    resolve(
      result
    )
  })
}

var headerReplacer = (str, newStr) => {
  return str.replace(`<meta name=loklokfbia content=12345>`, newStr)
}
var appDivReplacer = (str, newStr) => {
  return str.replace(`<div id=app></div>`, `
    <div id="app">
      ${newStr}
    </div>
  `)
}

// firebase hosting
app.get('/.well-known/acme-challenge/oB0iXwyzRXSMJgpcVD5zseEINNhOu4J9bnK-nRRFWBk', (req, res) => {
  var confirmCode = fs.readFileSync(path.resolve(__dirname, './code/oB0iXwyzRXSMJgpcVD5zseEINNhOu4J9bnK-nRRFWBk'), 'utf8')
  res.send(confirmCode)
})

webpacker({ app })

app.get('*', (req, res) => {
  // res.set('Cache-Control', 'public, max-age=60, s-maxage=180')
  Promise.all([
    composeMetaTags({ req, res }),
    composeAppDiv({ req, res })
  ])
    .then((promises) => {
      var result = appHTML
      result = headerReplacer(result, promises[0])
      result = appDivReplacer(result, promises[1])
      return result
    })
    .then((processedString) => {
      res.send(processedString)
    })
    .catch(() => {
      res.send(appHTML)
    })
})

exports.app = functions.https.onRequest(app)
