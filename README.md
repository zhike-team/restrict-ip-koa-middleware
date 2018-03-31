# restrict-ip-koa-middleware

## 用途

这个中间件用来限制来访者的 IP 地址，起到类似防火墙的作用。

## 功能

- 白名单通过策略：只有白名单内的 IP 允许访问
- 黑名单拦截策略：只有黑名单内的 IP 不允许访问
- 内网地址通过：与白名单策略配合使用，允许不在白名单内的 IP 地址通过
- 自定义方式获取 IP 地址：取 IP 地址可用自定义方式，例如从 Header 里取 x-forwarded-for 或者 x-real-ip 字段等
- 自定义拦截后的处理方法：可以拦截、允许通过、自定义返回消息体

## 默认行为
-

## TDD

```
  白名单外网地址
    ✓ 在白名单，通过
    ✓ 不在白名单，拦截

  白名单且允许内网地址
    ✓ 不在白名单，但是本机地址 通过
    ✓ 不在白名单，但是是 A 类内网地址 通过
    ✓ 不在白名单，但是是 B 类内网地址 通过
    ✓ 不在白名单，但是是 C 类内网地址 通过
    ✓ 不在白名单，也不是内网地址 拦截

  黑名单策略
    ✓ 不在黑名单 通过
    ✓ 在黑名单 拦截

  自定义函数拦截
    ✓ 自定义拦截函数 通过
    ✓ 自定义拦截函数 拦截

  trustedHeaderSequence
    ✓ trustedHeaderSequence 不指定，默认先 x-forwarded-for 后 x-real-ip
    ✓ trustedHeaderSequence 按指定顺序
    ✓ trustedHeaderSequence 为空数组，看直接 IP
```
