---
title: "ServiceWorker的一些使用经验"
subtitle: "My experience of using ServiceWorker"
background: "/img/service-worker.webp"
author: "wavesheep"
date: "2019-09-15 12:00:00"
tags:
- "ServiceWorker"
---

## 前言

前段时间在我的博客上用上了ServiceWorker，使用过程也遇到了不少坑，也收获了不少心得，这篇文章就来谈谈的我的这些心得。

本文的读者定位是刚接触ServiceWorker而不知道如何下手的新手，我的假设是你对ServiceWorker的API已经有一定程度的了解。

## install的注意事项

### 更新SW不意味用户访问到的一定是最新的

SW通过`navigator.serviceWorker.register`API对SW进行注册。同样的API的在以下的两种境况下表现是不同的

1. `第一次安装`：浏览器去指定地址下载SW并触发SW的`install`事件，完成后变使其状态变成`active`，此时SW便可接管这个网站的请求。
2. `非第一次安装`: 这种情况下浏览器在下载新的SW并触发完`intsall`事件后并不会直接是SW变为`active`态，老SW依然继续接管着网站，只有当用户关闭页面后重新打开时新的SW才会接管网站，**用户在导航栏进行普通刷新也不行**。

### 如何解决上述问题

1. `skipWating`强制接管：SW设计时考虑到用户的这方面需求，提供了`skipWaiting`这个API让新SW强制跳过等待`active`阶段，实现直接接管。

   ```js
   self.addEventListener('install', event => {
     self.skipWaiting();
   })
   ```

   *但强制的行为总会存在一定的弊端，SW也不例外*。

   上文提到了SW是通过`navigator.serviceWorker.register`API对SW进行注册的，这种方式也就意味着注册是在*页面至少已经了加载了一部分下执行的*。在这种情况下强制激活的会导致一个问题，那就是页面的有部分时间是由老SW接管的，已加载的部分页面默认会去请求老的数据，但新的SW可能会把老的一些缓存清理掉，这就导致页面存在部分资源无法加载可能性。

   所以，除非你可以断定这么做没问题不然最好还是换个方案

2. 模拟用户打开关闭的过程：打开关闭其实是个刷新过程，调用`window.location.reload()`即可。你可能会觉得奇怪我刚才提到用户在导航栏进行普通刷新不能跳过等待阶段，为什么用这个就可以。这是因为这种刷新请求是可以被SW拦截的，但是`window.location.reload()`不会，因而可以以这种方式刷新页面。具体实现如下。

   ```js
   navigator.serviceWorker.addEventListener('controllerchange', () => {
     // 你的刷新逻辑
   })
   ```

   虽然是可以直接调用`window.location.reload()`完成刷新，但这样显然对用户不大友好，突然屏幕一闪开始刷新，我想用户大概是会是这个表情:smile:。所以给用户一个刷新提示是很有必要的，比如弹出一个snackbar让用户自己去刷新就不突兀了。

   ![snackbar](/img/snackbar.webp)

## 缓存策略

install方案只是让ServiceWorker可以尽快跑起来的第一步，而缓存策略则是让ServiceWorker能好好上班的关键，总结下来有以下五个

1. Cache Only
2. Runtime Caching (Cache First)
3. Stale-While-Revalidate
4. Network First
5. Network Only

### Cache Only

`Cache only`即仅从只从`CacheStorage`加载资源，适用于加载在ServiceWorker`install`时预先缓存的资源。

### Runtime Caching (Cache First)

`Runtime Caching`即先从`CacheStorage`加载资源，如果资源无法找到，则去网络加载并缓存到`CacheStorage`供下次加载使用，适用于保持不变的静态资源。

### Stale-While-Revalidate

`Stale-While-Revalidate`是最为复杂的策略，这个策略在HTTP缓存`Cache-Control`也存在，算是个很经典的策略了。我无法给出合适的翻译，逐词可译为`陈旧-当-重新验证`，大致可以理解为先返回陈旧的内容在去请求新的内容进行对比更新。具体操作为同时请求`CacheStorage`和网络资源，如果`CacheStorage`中无缓存以`Runtime Caching`的方式进行更新，如果有缓存则先返回缓存，待网络结果返回后验证更新缓存。这适用于可能会发生更新的资源。

看到上面你可能已经注意到了在这个策略下**用户看到的东西并不是最新的**，如果想要用户看到最新的内容必须对页面进行刷新，你可以通过向主线程传递消息的形式提示用户进行刷新。

```js
// service worker
self.clients.matchAll()
    .then(clients => {
        clients.forEach(client => {
          client.postMessage({
            'command': 'UPDATE_FOUND'
          })
        })
      })

// 主线程
navigator.serviceWorker.onmessage = (e) => {
      const data = e.data

      if (data.command == "UPDATE_FOUND") {
        // 你的刷新逻辑
      }
    }
```



### Network First

`Network First`即优先从网络加载资源，这是对会经常更新的资源的一种离线优化方式。

### Network Only

`Network First`即只从网络加载，针对一些必须保持最新的资源使用。

## `setTimeout`大法好

看到这你一定会觉得很突兀:open_mouth:，迷惑为什么我要说setTimeout大法好呢。不知道你有没有想过当某一页的页面(页面本身)应用我上文所述的`Stale-While-Revalidate`策略发生更新时会发生什么呢？如果你在本地运行服务器并在ServiceWorker中直接向主线程发出消息，要求显示消息通知，你会发现你发出的消息很有可能**石沉大海**了，这又是为啥呢？因为**消息监听器此时都还没有被注册**。比如我这个博客,消息监听器注册完成时已经过去了300ms

![](/img/sw-register.webp)

**这不只在本地会发生，真实场景中用户网络比较快也会发生这种情况**。

读到这我想你应该知道为什么我说`setTimeout`大法好了吧:smile:

## 参考资源

[https://juejin.im/post/6844903792522035208#heading-13](https://juejin.im/post/6844903792522035208#heading-13)

[https://developers.google.com/web/tools/workbox/modules/workbox-strategies](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)

