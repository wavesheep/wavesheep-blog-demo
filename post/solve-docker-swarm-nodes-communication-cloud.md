---
title: "解决云服务器docker swarm节点间无法通信问题"
subtitle: "Solved the problem that cloud server docker swarm nodes could not communicate with each other"
author: "wavesheep"
date: "2020-01-19 12:00:00"
tags:
- "杂记"
- "docker swarm"
---
## 原因
如果你的swarm运行在默认端口，那么你就可能和我一样遇到了VXLAN默认端口4789/udp被云服务厂商阻断的问题。比如阿里云在文档中提到了这点，链接->[阿里云添加udp监听文档](https://help.aliyun.com/document_detail/86130.html?spm=5176.11065259.1996646101.searchclickresult.2708292b52T6hI)。
## 解决方案
这个问题在docker:v19.03之前无法直接解决。19.03版本，docker在swarm init之上增加了--data-path-port uint32 的配置项用于更改docker swarm的VXLAN端口。
下面以指定端口5789/udp为例
```shell
sudo docker swarm init --data-path-port 5789
```