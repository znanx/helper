const { tmpfiles, uploader, shorten, imgbb } = require('../index.ts')
const fs = require('fs')
const path = require('path')

const imagePath = path.join(__dirname, 'thumb.jpg')
tmpfiles(fs.readFileSync(imagePath)).then(console.log)

//shorten('https://google.com').then(console.log)