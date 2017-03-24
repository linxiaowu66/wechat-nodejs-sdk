const OAuth = require('wechat-oauth')
const Redis = require('ioredis');
const debug = require('debug')('weixin-sdk')
const cache = require('memory-cache')
const request = require('request-promise')
const Token = require('./libs/token')
const Signature = require('./libs/signature')
const Log = require('./libs/logger')

module.exports = class WeixinSDK {
  constructor(options) {
    const defaultOptions = {
      noncestr: 'Wm3WZYTPz0wzccnW',
      appId: '', // 你的公众号的APPID
      appSecret: '', // 你的公众号的APP Secret
      granType: 'client_credential',
      accessTokenUrl: 'https://api.weixin.qq.com/cgi-bin/token',
      ticketUrl: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket',
      redisTokenKey: '', // Redis的Key值
      redisName: '', // Redis的名称
      appToken: '1111111',
      redisHost: [], // Redis的主机
      redisPwd: '', // Redis密码
      cacheKey: '' // Ticket缓存的名称
    }
    this.config = Object.assign(defaultOptions, options)
    if (options.logger) {
      Log.logger = logger
    }
  }
  /**
   * 初始化微信相关的所有预置条件，比如初始化Redis客户端，微信OAuth客户端
   *
   *
   * @memberOf WeixinSDK
   */
  init() {
    Log.logger.info('weixin sdk initialization.......config: ', this.config)
    // 初始化Redis客户端缓存微信Token
    this.redisClient = new Redis({
      sentinels: this.config.redisHost,
      name: this.config.redisName,
      password: this.config.redisPwd
    })
    this.weixinClient = new OAuth(this.config.appId, this.config.appSecret)
    // 延长微信服务器认证超长时间
    this.weixinClient.setOpts({ timeout: 10000 });
    this.redisClient.get(this.config.redisTokenKey).then((token) => {
      if (!token) {
        Token.generateTokenAndSave({
          redisClient: this.redisClient,
          accessTokenUrl: this.config.accessTokenUrl,
          granType: this.config.granType,
          appId: this.config.appId,
          appSecret: this.config.appSecret,
          redisTokenKey: this.config.redisTokenKey
        })
        .then(token => {
          Log.logger.info('in weixin-sdk init state, token is: ', token)
        })
      }
    }).catch((err) => {
      Log.logger.error('initWeiXinToken failure: ', err)
    })
  }

  /**
   *
   *
   * @returns 微信基础Token(一天只能生成2000次)
   *
   * @memberOf WeixinSDK
   */
  getWeixinToken(options) {
    return new Promise((resolve, reject) => {
      // 说明请求来自Ticket的更新，这个时候我们就直接同步更新Token，不再从Redis读取
      if (options === 'ticket') {
        return resolve(Token.generateTokenAndSave({
            redisClient: this.redisClient,
            accessTokenUrl: this.config.accessTokenUrl,
            granType: this.config.granType,
            appId: this.config.appId,
            appSecret: this.config.appSecret,
            redisTokenKey: this.config.redisTokenKey
        }))
      }
      this.redisClient.get(this.config.redisTokenKey).then((token) => {
        if (!token) {
          resolve(Token.generateTokenAndSave({
            redisClient: this.redisClient,
            accessTokenUrl: this.config.accessTokenUrl,
            granType: this.config.granType,
            appId: this.config.appId,
            appSecret: this.config.appSecret,
            redisTokenKey: this.config.redisTokenKey
          }))
        } else {
          resolve(token)
        }
      }).catch((err) => {
        Log.logger.error('getWeixinToken occur error: ', err)
        reject(err)
      })
    })
  }

  /**
   * 用于微信公众测试号验证服务器有效性
   *
   * @param {any} signature
   * @param {any} timestamp
   * @param {any} nonce
   * @param {any} echostr
   * @returns
   *
   * @memberOf WeixinSDK
   */
  getWebsiteSignature(timestamp, nonce, echostr) {
    return Signature.generateWebsiteSignature({
      timestamp,
      nonce,
      echostr,
      appToken: this.config.appToken
    })
  }
  /**
   * 用于调用微信SDK而需要针对每个URL生成唯一的签名
   *
   * @param {any} url
   * @returns
   *
   * @memberOf WeixinSDK
   */
  getSdkSignature(url) {
    return new Promise((resolve, reject) => {
      const jsapiTicket = cache.get(this.config.cacheKey)
      Log.logger.info('getSdkSignature get ticket from memory cache: ', jsapiTicket)
      if (jsapiTicket) {
        return resolve(Signature.sign({
          ticket: jsapiTicket,
          url,
          noncestr: this.config.noncestr,
          appId: this.config.appId
        }))
      }
      // 当Ticket过期的时候我们也让Token重新获取
      // 否则如果二者不是在同一个时间点请求的时候会出现Ticket过期了，但是Token没有过期
      // 进而导致下面的request报错，微信端返回无效的token这类的错误
      this.getWeixinToken('ticket')
      .then(token => request(`${this.config.ticketUrl}?access_token=${token}&type=jsapi`))
      .then((json) => {
        const result = JSON.parse(json)
        if (result.errcode) {
          Log.logger.error('weixin get ticket return error: ', result.errcode, result.errmsg)
          return reject(result.errmsg)
        }
        // cache超时时间改成和基础Token一致，2个小时提前5分钟失效
        cache.put(this.config.cacheKey,
          result.ticket, (result.expires_in - 300)* 1000);
        resolve(Signature.sign({
          ticket: result.ticket,
          url,
          noncestr: this.config.noncestr,
          appId: this.config.appId
        }))
      })
      .catch((err) => {
        Log.logger.error('getSdkSignature Error: ', err)
        reject(err)
      })
    })
  }
  /**
   * 用于根据微信回调code获取用户的openid
   *
   * @param {any} code
   * @returns 用户的OpenId和网页Token
   *
   * @memberOf WeixinSDK
   */
  getWeixinOpenId(code) {
    return new Promise((resolve, reject) => {
      this.weixinClient.getAccessToken(code, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  getAuthorizeURL(callBackUrl) {
    return this.weixinClient.getAuthorizeURL(
      callBackUrl, '', 'snsapi_userinfo')
  }
}
