---
title: "web性能优化入门"
subtitle: "Web performance optimization basics"
background: "/img/rail.webp"
author: "wavesheep"
date: "2019-11-21 12:00:00"
tags:
- "web性能优化"
- "笔记"
---

## 前言

俗话说的好，地基不牢地动山摇，想要做好web性能优化还是得从最基本的理论学起。下面就给大家分享我最近看得一些觉得很nice的文章，让大家少花些无用搜索时间。

## RAIL

RAIL是一个以用户为中心的性能模型。它代表了Web应用程序生命周期的四个不同方面：Response(响应)，Animation(动画)，Idle(空闲)和Load(加载)，用户各个方面都有着不同的需求。

![RAIL性能模型](/img/rail.webp)

针对这些方面，`RAIL`给出了一份列表来量化**用户对性能延迟的感知指标**

| 响应时间    | 用户性能感知                                                 |
| ----------- | :----------------------------------------------------------- |
| 0至16ms     | 对于一个60fps刷新频率的屏幕，一个动画应该在16ms刷新才不会让用户觉得卡顿 |
| 0至100ms    | 在此时间范围内响应用户的操作，用户会感觉到结果是即时的。超过这个时间，结果与反应之间的联系就被打破了。 |
| 100至300ms  | 用户会体验到轻微的可感知延迟。                               |
| 300至1000ms | 在这个事件范围内，任务看起来是断断续续的。注：对于网络上的大多数用户而言，加载页面或更改视图是一项任务。 |
| 1000ms以上  | 超过1000毫秒（1秒）后，用户将失去对执行的任务失去去耐心。    |
| 10000ms以上 | 超过10000毫秒（10秒），用户会感到失望，并且很可能放弃任务。  |

它也指出了下面这些**优化目标**

1. 响应：输入延迟时间（从点按到绘制）小于 100 毫秒。
   用户点按按钮（例如打开导航）。
2. 动画：每个帧的工作（从 JS 到绘制）完成时间小于 16 毫秒。
   用户滚动页面，拖动手指（例如，打开菜单）或看到动画。 拖动时，应用的响应与手指位置有关（例如，拉动刷新、滑动轮播）。 此指标仅适用于拖动的持续阶段，不适用于开始阶段。
3. 空闲：主线程 JS 工作分成不大于 50 毫秒的块。
   用户没有与页面交互，但主线程应足够用于处理下一个用户输入。
4. 加载：页面可以在 1000 毫秒内就绪。
   用户加载页面并看到关键路径内容。

针对这些优化目标详细解释请见[原文](https://developers.google.com/web/tools/chrome-devtools/profile/evaluate-performance/rail?hl=en)

## PRPL

`PRPL` 是一种技术性的指导，用于使网页更快的加载并变得可交互：

- Push（或者 preload）最重要的资源。
- 尽快渲染（Render）初始路径。
- 预缓存（Pre-cache）剩余资源.
- 延迟加载（Lazy load）其他路由和非关键资源

具体操作见[原文](https://web.dev/apply-instant-loading-with-prpl/)

##  Preload, Prefetch And Priorities in Chrome

这篇文章介绍了preload和prefetch技术的使用，还介绍了chrome的资源加载优先级，如下图所示，对优化网站加载的关键路径具有很大的指导意义[文章地址](https://medium.com/reloading/preload-prefetch-and-priorities-in-chrome-776165961bbf)

![chrome resource priority](/img/chrome-priority.webp)

## Progressive Web Metrics

渐进式web指标是评价页面性能的一些指标，这篇[文章](https://codeburst.io/performance-metrics-whats-this-all-about-1128461ad6b)详细地介绍了它

主要解释了FP，FCP，FMP， TTFI，TTCI等基本概念。

