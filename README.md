# restrict-ip-koa-middleware

## TDD

[*] 白名单策略 通过
[] 白名单策略 拦截
[] 白名单内网地址策略 通过
[] 白名单内网地址策略 拦截

[] 黑名单策略 通过
[] 黑名单策略 拦截

[] 自定义拦截函数 onRestrict

[] trustedHeaderSequence 不指定，默认先 x-forwarded-for 后 x-real-ip
[] trustedHeaderSequence 自定义，按照顺序取 IP
[] trustedHeaderSequence = []，看直接 IP
