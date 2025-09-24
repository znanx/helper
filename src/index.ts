import axios from 'axios'
import { fromBuffer as getExtension } from 'file-type'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import FormData from 'form-data'
import retry from 'async-retry'
import path from 'path'
import helper from './helper'
const creator = '@naando.io'

exports.shorten = (url: string, time = 60) => new Promise(async (resolve, reject) => {
   try {
      let json = await (await axios.post('https://moonx.my.id/shorten', {
         originalUrl: url,
         expiresIn: time
      })).data
      resolve({
         creator,
         ...json
      })
   } catch (e) {
      reject({
         creator,
         status: false,
         msg: e instanceof Error ? e.message : String(e)
      })
   }
})
exports.uploader = (i: Buffer | string, originalFilePath = null) => new Promise(async (resolve, reject) => {
   try {
      if (!Buffer.isBuffer(i) && !helper.isUrl(i)) {
         return resolve({
            creator,
            status: false,
            msg: 'Only buffer and URL formats are allowed',
         })
      }
      const file = Buffer.isBuffer(i) ? i : helper.isUrl(i) ? await (await axios.get(i, {
         responseType: 'arraybuffer'
      })).data : null
      if (!file) {
         return resolve({
            creator,
            status: false,
            msg: 'Failed to process file input',
         })
      }
      let fileType = await getExtension(file)
      let fileName = 'file'
      if (originalFilePath) {
         fileName = path.basename(originalFilePath || '', path.extname(originalFilePath || ''))
      }
      const extension = fileType ? `.${fileType.ext}` : path.extname(originalFilePath || '') || '.txt'
      const fullFileName = `${fileName}${extension}`
      const form = new FormData()
      form.append('file', file, fullFileName)
      const response = await (await axios.post('https://moonx.my.id/upload', form, {
         headers: {
            ...form.getHeaders(),
         },
      })).data
      resolve({
         creator,
         status: true,
         ...response
      })
   } catch (e) {
      reject({
         creator,
         status: false,
         msg: e instanceof Error ? e.message : String(e)
      })
   }
})
exports.tmpfiles = (i: Buffer | string, extension?: string) => new Promise(async (resolve, reject) => {
   try {
      if (!Buffer.isBuffer(i) && !helper.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
      const file = Buffer.isBuffer(i) ? i : helper.isUrl(i) ? await (await axios.get(i, {
         responseType: 'arraybuffer'
      })).data : null
      let ext = 'txt'
      const fileTypeResult = await getExtension(file)
      if (fileTypeResult) {
         ext = fileTypeResult?.ext || 'txt'
      }
      let form = new FormData()
      form.append('file', i, helper.uuid(25) + '.' + (extension || ext))
      let json = await (await axios.post('https://tmpfiles.org/api/v1/upload', form, {
         headers: {
            "accept": "/",
            "accept-language": "id-ID , id q=O. 9 , en- US  q=0.8, en q=0.7",
            "content-type": "multipart/form-data",
            "origin": "https://tmpfiles.org/",
            "referer": "https://tmpfiles.org/",
            "sec-ch-ua": '"Chromium"v="107", "Not=A?Brand"v="24"',
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": "Android",
            "sec-fetch-dest": "empty",
            "sec-fetch-mcde": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Linux Android 6.0.1 SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36",
            "x-requested-with": "XMLHttpRequest",
            ...form.getHeaders()
         }
      })).data
      if (json.status != 'success') return resolve({
         creator,
         status: false,
         msg: 'Failed to uploaded'
      })
      const url_ = new URL(json.data.url)
      resolve({
         creator,
         status: true,
         data: {
            url: url_.origin + '/dl' + url_.pathname
         }
      })
   } catch (e) {
      reject({
         creator,
         status: false,
         msg: e instanceof Error ? e.message : String(e)
      })
   }
})
exports.imgbb = (i: Buffer | string) => new Promise(async (resolve, reject) => {
   try {
      if (!Buffer.isBuffer(i) && !helper.isUrl(i)) return resolve({
         creator,
         status: false,
         msg: 'only buffer and url formats are allowed'
      })
      const parse = await (await axios.get('https://imgbb.com', {
         headers: {
            "User-Agent": "Mozilla/5.0 (Linux Android 6.0.1 SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36"
         }
      }))
      const token = parse.data.match(/PF\.obj\.config\.auth_token="([^"]*)/)[1]
      const cookie = Array.isArray(parse.headers['set-cookie']) ? parse.headers['set-cookie'].join(', ') : ''
      const file = Buffer.isBuffer(i) ? i : helper.isUrl(i) ? await (await axios.get(i, {
         responseType: 'arraybuffer'
      })).data : null
      try {
         const fileTypeResult = await getExtension(file)
         var ext: string = fileTypeResult ? fileTypeResult.ext : 'jpg'
      } catch (e) {
         var ext: string = 'jpg'
      }
      let form = new FormData
      form.append('source', Buffer.from(file), 'image.' + ext)
      form.append('type', 'file')
      form.append('action', 'upload')
      form.append('timestamp', Date.now())
      form.append('auth_token', token)
      const json = await (await axios.post('https://imgbb.com/json', form, {
         headers: {
            "Accept": "*/*",
            "User-Agent": "Mozilla/5.0 (Linux Android 6.0.1 SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36",
            "Origin": "https://imgbb.com",
            "Referer": "https://imgbb.com/upload",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            cookie,
            ...form.getHeaders()
         }
      })).data
      if (json.status_code != 200) return reject({
         creator,
         status: false,
         msg: `Failed to Upload!`
      })
      resolve({
         creator,
         status: true,
         data: {
            url: json.image.image.url
         },
         original: json,
      })
   } catch (e) {
      reject({
         creator,
         status: false,
         msg: e instanceof Error ? e.message : String(e)
      })
   }
})
exports.imghost = (i: Buffer | string): Promise<any> => new Promise(async (resolve, reject) => {
   try {
      if (!Buffer.isBuffer(i) && !helper.isUrl(i)) throw new Error('Only buffer and url formats are allowed')
      const parse = await (await axios.get('https://imghost.online/en', {
         headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36"
         }
      }))
      const token = cheerio.load(parse.data)('meta[name="csrf-token"]')?.attr('content')
      const cookie = parse?.headers?.['set-cookie']?.join(';')
      if (!token || !cookie) throw new Error('Can\'t get credentials')
      const file = Buffer.isBuffer(i) ? i : helper.isUrl(i) ? await (await axios.get(i, {
         responseType: 'arraybuffer'
      })).data : null
      let ext = 'jpg'
      const parsed = await getExtension(file)
      if (parsed) {
         ext = parsed?.ext || 'jpg'
      }
      let form = new FormData
      form.append('dzuuid', uuidv4())
      form.append('dzchunkindex', '0')
      form.append('dztotalfilesize', file.length)
      form.append('dzchunksize', file.length)
      form.append('dztotalchunkcount', '1')
      form.append('dzchunkbyteoffset', '0')
      form.append('size', file.length)
      form.append('type', parsed?.mime)
      form.append('password', '')
      form.append('upload_auto_delete', '0')
      form.append('file', Buffer.from(file), 'image.' + ext)
      const json = await retry(async () => {
         const response = await (await axios.post('https://imghost.online/upload', form, {
            headers: {
               "Accept": "*/*",
               "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36",
               "Origin": "https://imghost.online",
               "Referer": "https://imghost.online/",
               "Referrer-Policy": "strict-origin-when-cross-origin",
               cookie,
               "X-CSRF-TOKEN": token,
               "X-Requested-With": "XMLHttpRequest",
               ...form.getHeaders()
            }
         })).data
         if (!response.direct_link) throw new Error('Failed to Upload!')
         return response
      }, {
         retries: 5,
         factor: 2,
         minTimeout: 1000,
         maxTimeout: 5000,
         onRetry: (e, n) => { }
      })

      if (!json.direct_link) throw new Error('Failed to Upload!')
      resolve({
         creator,
         status: true,
         original: json,
         data: {
            url: json.direct_link
         }
      })
   } catch (e) {
      resolve({
         creator,
         status: false,
         msg: e.message
      })
   }
})