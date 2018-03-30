const assert = require('assert')
const request = require('supertest')
const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const router = new Router()
const restrictIp = require('../index')

const app = new Koa()


// app.use(async (ctx, next) => {
//   try{
//     await next()
//   }
//   catch(e){
//     console.error(e)
//     ctx.body = e
//   }
// })

// app.use(bodyParser())
app.use(router.routes())

const server = app.listen()

let blacklist = ['4.4.4.4']
let whitelist = ['5.5.5.5', '6.6.6.6']

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

async function passed(ctx, next) {
  ctx.body = 'passed'
}

let ctrl = async ctx => {
  ctx.body = 'passed'
  // ctx.body = {a:1}
}

router.get('/', ctrl)

// router.get('/', whitelistRestrict, passed)
// router.get('/header/none', whitelistRestrict, passed)
// router.get('/header/x-forwarded-for', whitelistRestrict, passed)
// router.get('/header/x-real-ip', whitelistRestrict, passed)


const publicIp = '5.5.5.5'
const privateIp = '10.0.0.1'
const xForwardedFor = `${publicIp}, ${privateIp}`
const xRealIp = '4.4.4.4'

describe('Public IP', function () {
  it('1. 白名单策略 通过', async function () {
    let fakeIp = '2.2.2.2'
    let resp = await request(server)
      .get('/')
      .set('x-real-ip', fakeIp)
      .expect(200)

    console.log(JSON.stringify(resp))
  })
})

