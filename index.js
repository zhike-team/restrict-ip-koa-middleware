'use strict';
const ip = require('ip');

module.exports = (options) => {
  let policy; // 策略：白名单还是黑名单
  let onRestrict; // IP禁止访问后的回调函数

  if (!(options instanceof Object)) {
    throw new Error('options must be an Object');
  }

  if (options.onRestrict) {
    if (options.onRestrict.constructor.name !== 'AsyncFunction') {
      throw new Error('onRestrict must be an AsyncFunction');
    }
    onRestrict = options.onRestrict;
  }

  if (options.whitelist) {
    if (!(options.whitelist instanceof Set)) {
      throw new Error('whitelist must be a Set');
    }
    policy = 'white';
  }

  if (policy) { // whitelist policy
    if (options.blacklist) {
      throw new Error('whitelist and blacklist are exclusive');
    }
  }
  else if (options.blacklist) { // blacklist policy
    if (!(options.blacklist instanceof Set)) {
      throw new Error('blacklist must be a Set');
    }
    if(options.allowPrivate){
      console.warn('allowPrivate only work with whitelist');
    }
  }
  else { // no policy
    throw new Error('must provide whitelist or blacklist');
  }

  let trustedHeaderSequence = ['x-forwarded-for', 'x-real-ip']; // 默认先看 x-forwarded-for 再看 x-real-ip
  if (options.trustedHeaderSequence instanceof Array) {
    trustedHeaderSequence = options.trustedHeaderSequence.map(c => c.toLowerCase());
  }

  function checkWhitelist(ipToCheck) {
    return options.whitelist.has(ipToCheck) || (options.allowPrivate && ip.isPrivate(ipToCheck));
  }

  function checkBlacklist(ipToCheck) {
    return !options.blacklist.has(ipToCheck);
  }

  return async (ctx, next) => {
    let ipFromHeader;

    for (let field of trustedHeaderSequence) {
      if (ctx.headers[field]) {
        ipFromHeader = ctx.headers[field].split(', ')[0]; // 取 xx, yy, zz 最先出现的地址
        break;
      }
    }

    let ipToCheck = ipFromHeader || ctx.ip;

    let pass = policy === 'white' ? checkWhitelist(ipToCheck) : checkBlacklist(ipToCheck);

    if (!pass) {
      if (onRestrict) {
        await onRestrict(ctx, next, ipToCheck);
      }
      else {
        let err = new Error('IP restricted');
        err.ip = ipToCheck;
        throw err;
      }
    }
    else {
      await next();
    }
  }
}