const restrictIp = require('../index')
const assert = require('assert')
const request = require('supertest')
const Koa = require('koa')
const Router = require('koa-router')

const app = new Koa()

app.use(async (ctx, next) => {
  try{
    await next()
  }
  catch(e){
    if(e.message === 'IP restricted'){
      ctx.status = 403
      ctx.body = e.message + ': ' + e.ip
    }
  }
})

const router = new Router()
app.use(router.routes())

const server = app.listen()

let whitelist = ['2.2.2.2', '3.3.3.3']
let blacklist = ['4.4.4.4']

const whitelistRestrict = restrictIp({
  whitelist: new Set(whitelist)
})

const whitelistAllowPrivateRestrict = restrictIp({
  allowPrivate: true,
  whitelist: new Set(whitelist)
})

const blacklistRestrict = restrictIp({
  blacklist: new Set(blacklist)
})

const customHandlerRestrict = restrictIp({
  blacklist: new Set(blacklist),
  onRestrict: async (ctx, next, ip) => {
    if(ctx.query.hasPassport){
      await next()
    }
    else{
      console.log(ip + ' restricted')
      ctx.status = 403
    }
  }
})

const defaultTrustedHeaderSequenceRestrict = restrictIp({
  blacklist: new Set(blacklist)
})

const customTrustedHeaderSequenceRestrict = restrictIp({
  blacklist: new Set(blacklist),
  trustedHeaderSequence: ['x-real-ip', 'x-forwarded-for']
})

const noTrustedHeaderSequenceRestrict = restrictIp({
  blacklist: new Set(blacklist),
  trustedHeaderSequence: []
})

async function passed(ctx, next) {
  ctx.status = 200
  ctx.body = 'passed'
}

router.get('/', whitelistRestrict, passed)
router.get('/1', whitelistAllowPrivateRestrict, passed)
router.get('/2', blacklistRestrict, passed)
router.get('/3', customHandlerRestrict, passed)
router.get('/4', defaultTrustedHeaderSequenceRestrict, passed)
router.get('/5', customTrustedHeaderSequenceRestrict, passed)
router.get('/6', noTrustedHeaderSequenceRestrict, passed)

describe('白名单外网地址', function () {
  it('在白名单，通过', async function () {
    let fakeIp = '2.2.2.2'
    await request(server)
      .get('/')
      .set('x-real-ip', fakeIp)
      .expect(200)
  })
  it('不在白名单，拦截', async function () {
    let fakeIp = '9.9.9.9'
    await request(server)
      .get('/')
      .set('x-real-ip', fakeIp)
      .expect(403)
  })
})

describe('白名单且允许内网地址', function () {
  it('不在白名单，但是本机地址 通过', async function () {
    await request(server)
      .get('/1')
      .expect(200)
  })
  it('不在白名单，但是是 A 类内网地址 通过', async function () {
    let fakeIp = '10.0.0.2'
    await request(server)
      .get('/1')
      .set('x-real-ip', fakeIp)
      .expect(200)
  })
  it('不在白名单，但是是 B 类内网地址 通过', async function () {
    let fakeIp = '172.16.0.2'
    await request(server)
      .get('/1')
      .set('x-real-ip', fakeIp)
      .expect(200)
  })
  it('不在白名单，但是是 C 类内网地址 通过', async function () {
    let fakeIp = '192.168.0.2'
    await request(server)
      .get('/1')
      .set('x-real-ip', fakeIp)
      .expect(200)
  })
  it('不在白名单，也不是内网地址 拦截', async function () {
    let fakeIp = '9.9.9.9'
    await request(server)
      .get('/1')
      .set('x-real-ip', fakeIp)
      .expect(403)
  })
})

describe('黑名单策略', function () {
  it('不在黑名单 通过', async function () {
    await request(server)
      .get('/2')
      .expect(200)
  })
  it('在黑名单 拦截', async function () {
    let fakeIp = '4.4.4.4'
    await request(server)
      .get('/2')
      .set('x-real-ip', fakeIp)
      .expect(403)
  })
})

describe('自定义函数拦截', function () {
  it('自定义拦截函数 通过', async function () {
    let fakeIp = '4.4.4.4'
    await request(server)
      .get('/3?hasPassport=1')
      .set('x-real-ip', fakeIp)
      .expect(200)
  })
  it('自定义拦截函数 拦截', async function () {
    let fakeIp = '4.4.4.4'
    await request(server)
      .get('/3')
      .set('x-real-ip', fakeIp)
      .expect(403)
  })
})

describe('trustedHeaderSequence', function () {
  it('trustedHeaderSequence 不指定，默认先 x-forwarded-for 后 x-real-ip', async function () {
    let fakeIp = '4.4.4.4'
    await request(server)
      .get('/4')
      .set('x-forwarded-for', fakeIp)
      .set('x-real-ip', '127.0.0.1')
      .expect(403)
  })

  it('trustedHeaderSequence 按指定顺序', async function () {
    let fakeIp = '4.4.4.4'
    await request(server)
      .get('/5')
      .set('x-forwarded-for', fakeIp)
      .set('x-real-ip', '127.0.0.1')
      .expect(200)
  })

  it('trustedHeaderSequence 为空数组，看直接 IP', async function () {
    let fakeIp = '4.4.4.4'
    await request(server)
      .get('/6')
      .set('x-forwarded-for', fakeIp)
      .set('x-real-ip', fakeIp)
      .expect(200)
  })
})
