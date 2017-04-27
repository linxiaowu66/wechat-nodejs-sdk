const request = require('request-promise')
// const debug = require('debug')('weixin-sdk')
const Log = require('./logger')

function requestToken(args) {
  Log.logger.info('request weixin token again')
  // eslint-disable-next-line max-len
  return request(`${args.accessTokenUrl}?grant_type=${args.granType}&appid=${args.appId}&secret=${args.appSecret}`)
}


module.exports = {
  generateTokenAndSave(args) {
    Log.logger.info('weixin basic token fetch again..')
    return new Promise((resolve, reject) => {
      requestToken(args).then((result) => {
        const parseRes = JSON.parse(result)

        if (parseRes.errcode) {
          return reject(parseRes.errmsg)
        }
        // 微信Token失效时间是2个小时，在失效前5分钟提前失效掉缓存
        args.client.set(args.tokenKey, parseRes.access_token, 'EX', 115 * 60)
        Log.logger.info('request token from weixin server = ', parseRes.access_token)
        return resolve(parseRes.access_token)
      }).catch((err) => {
        reject(err)
      })
    })
  }
}