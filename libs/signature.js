const jsSHA = require('jssha')
const debug = require('debug')('weixin-sdk')
const crypto = require('crypto')

function raw(args) {
  let keys = Object.keys(args);
  keys = keys.sort()
  const newArgs = {};
  keys.forEach((key) => {
    newArgs[key.toLowerCase()] = args[key];
  });

  let string = '';
  // eslint-disable-next-line no-restricted-syntax
  for (const k in newArgs) { // eslint-disable-line guard-for-in
    string += `&${k}=${newArgs[k]}`;
  }
  string = string.substr(1);
  return string;
}

module.exports = {
  /**
  * @synopsis 签名算法
  *
  * @param jsapi_ticket 用于签名的 jsapi_ticket
  * @param url 用于签名的 url ，注意必须动态获取，不能 hardcode
  *
  * @returns
  */
  sign(args) {
    const timeStamp = parseInt(new Date().getTime() / 1000, 10)
    const ret = {
      jsapi_ticket: args.ticket,
      nonceStr: args.noncestr,
      timestamp: timeStamp,
      url: args.url
    };
    const string = raw(ret)
    const shaObj = new jsSHA(string, 'TEXT');

    ret.signature = shaObj.getHash('SHA-1', 'HEX');
    ret.appId = args.appId

    debug('sign algorithm complete successfully, ret value: ', ret)
    return ret
  },
  generateWebsiteSignature(args){
    debug('generateWebsiteSignature,args: ', args)
    /*  加密/校验流程如下： */
    // 1. 将token、timestamp、nonce三个参数进行字典序排序
    const array = [args.appToken, args.timestamp, args.nonce]
    array.sort()
    const str = array.toString().replace(/,/g, '')

    // 2. 将三个参数字符串拼接成一个字符串进行sha1加密
    const sha1Code = crypto.createHash('sha1')
    return sha1Code.update(str, 'utf-8').digest('hex')
  }
}


