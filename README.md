## Packages用途
提供给Nodejs端开发微信公众号相关的SDK

## Usage

1. 安装： yarn add weixin-sdk
2. 使用：
```
import WeixinSdk from 'weixin-sdk'
import config from '../../../config'

module.exports.weixinSdk = new WeixinSdk(config.weixin)
```

**Note**

    config.weixin中可能需要配置的参数
| 参数           | 说明                                                                          | 默认值                                                                                                                   |
|----------------|-------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| noncestr       | 随机数，用于验证消息的确来自微信服务器(可以参考https://mp.weixin.qq.com/wiki) | Wm3WZYTPz0wzccnW                                                                                                         |
| appId          | 微信为每个公众号生成的唯一的随机数                                            |                                                                                                        |
| appSecret      | 和appId组合使用，也是基于每个公众号                                           |                                                                                          |
| granType       | 向微信服务器请求的类型，目前只用于获取Token，所以使用默认值                   | client_credential                                                                                                        |
| accessTokenUrl | 向微信服务器请求Token的Url                                                    | https://api.weixin.qq.com/cgi-bin/token                                                                                  |
| ticketUrl      | 向微信请求Tiket的Url                                                          | https://api.weixin.qq.com/cgi-bin/ticket/getticket                                                                       |
| redisTokenKey  | 缓存到Redis的微信Token名称，根据不同环境下修改成自己的名字                    |                                                                                                          |
| redisName      | Redis的名称，根据不同环境下修改成自己的名字                                   |                                                                                                              |
| appToken       | 用于验证消息的确来自微信服务器(可以参考https://mp.weixin.qq.com/wiki)         | 1111111                                                                                                                  |
| redisHost      | Redis的地址                                                                   | [] |
| redisPwd       | Redis密码                                                                     | 
| cacheKey       | 缓存到Memory Cache的微信Ticket字段名称                                         | 

## API

**init()**

初始化微信相关的所有预置条件，比如初始化Redis客户端(因为目前采用redis缓存Token)，微信OAuth客户端

**getWeixinToken()**

用于获取微信基础Token，这个有别于网页Token，每天限制请求次数(1000次)

**getWebsiteSignature()**

用于微信公众测试号验证服务器有效性。开发者提交信息后，微信服务器将发送GET请求到填写的服务器地址URL上，我们需要按照微信指定的算法去生成一个返回值给微信服务器

**getSdkSignature()**

用于调用微信SDK而需要针对每个URL生成唯一的签名，当使用wx.config的时候会用到

**getWeixinOpenId()**

用于根据微信回调code获取用户的openid

**getAuthorizeURL()**

生成一个微信的认证回调URL
