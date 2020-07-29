---
title: "在Docker Swarm上部署Traefik2.x"
subtitle: "Install Traefik2.x on Docker Swarm"
background: "/img/traefik-dashboard.webp"
author: "wavesheep"
date: "2020-1-25 12:00:00"
tags:
- "教程"
- "docker swarm"
- "traefik2.x"
---
## 前言

最近，我将我的个人项目的服务迁移至了Docker Swarm。经过一番比较我决定使用Traefik2.x作为我的反向代理，负载均衡工具。由于目前主流docker集群是k8s， 导致找不到太多的资料，我在这上面花费了颇多时间，因此我决定写下这篇教程帮助大家快速部署。

这篇教程不会讲解docker swarm的部署，我的假设是你有一个正在工作的docker swarm集群。

## 网络配置

创建配置文件之前的第一件事是创建一个docker swarm [overlay](https://docs.docker.com/network/overlay/)网络，Traefik将使用该网络来监视要公开的服务。命令如下：

```shell
docker network create -d overlay traefik-net
```

## 安装Traefik

现在，我们创建docker compose file文件来安装Traefik，下面是我认为部署有效Traefik实例所需的最小配置。

```yaml
version: '3'

services:
  reverse-proxy:
    image: traefik:v2.3.1
    command:
      # 启用swarm模式支持
      - "--providers.docker.swarmMode=true"
      # 默认不公开容器
      - "--providers.docker.exposedbydefault=false"
      # 为traefik-net网络启用代理
      - "--providers.docker.network=traefik-net"
      # 创建名为`web`的入口点，并为其暴露于80端口。该入口点会指示其它容器
      # 在哪个端口公开，详情见下文应用部署示例
      - "--entrypoints.web.address=:80"
    ports:
      - 80:80
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - traefik-net
    deploy:
      placement:
        constraints:
          - node.role == manager

networks:
  traefik-net:
    external: true
```

参考命令：

```shell
docker stack deploy traefik -c traefik.yml
```

## 应用部署示例

下面我以*tutum/hello-world*作为部署示例，部署成功将会在在页面上显示“hello world”。配置如下：

```yaml
version: '3'
services:
  helloworld:
    image: tutum/hello-world:latest
    networks:
     # 与traefik同一个网络
     - traefik-net
    deploy:
      labels:
        # 对外暴露容器服务
        - "traefik.enable=true"
        # 对外访问的路由地址，路由规则请参考官网
        # https://docs.traefik.io/routing/routers/
        - "traefik.http.routers.helloworld.rule=Host(`你的路由`)"
        # 对外暴露的入口点
        - "traefik.http.routers.helloworld.entrypoints=web"
        # 容器内的入口点，treafik无法获知你的服务的访问入口点
        # 所以你必须以此告诉Traefik
        # Traefik同时会在此对横向拓展的容器建立负载均衡
        # 更多见https://docs.traefik.io/routing/services/
        - "traefik.http.services.helloworld.loadbalancer.server.port=80"
networks:
  traefik-net:
    external: true
```

## 添加https支持

如果你已经阅读上文，相信你已经能成功在http端口运行你的服务了。但这并不安全。下面我的将讲解如何添加https支持并创建全局重定向提高网站的安全性。下面是我的的配置

```yaml
version: '3'

services:
  reverse-proxy:
    image: traefik:v2.3.1
    command:
      # 启用swarm模式支持
      - "--providers.docker.swarmMode=true"
      # 默认不公开容器
      - "--providers.docker.exposedbydefault=false"
      # 为traefik-net网络启用代理
      - "--providers.docker.network=traefik-net"
      # 创建名为`web`的入口点，并为其暴露于80端口。该入口点会指示其它容器
      # 在哪个端口公开，详情见下文应用部署示例
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      # Let's Encrypt httpchallenge方式获取https证书
      # 你也可以选择其他challenge或者自己上传证书，推荐使用dns chanllenge，支持泛域名，自动申请，自动续期
      # 更多见https://docs.traefik.io/https/overview/
      - "--certificatesresolvers.le.acme.httpchallenge=true"
      - "--certificatesresolvers.le.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencryptresolver.acme.email=你的邮箱"
      - "--certificatesresolvers.letsencryptresolver.acme.storage=/letsencrypt/acme.json"
    ports:
      - 80:80
      - 443:443
    volumes:
      - traefik-certificates:/letsencrypt
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - traefik-net
    deploy:
      placement:
        constraints:
          - node.role == manager
      labels:
        - "traefik.enable=true"
        # 全局重定向匹配路由规则，这里匹配了所有路由
        - "traefik.http.routers.http2https.rule=HostRegexp(`{any:.+}`)"
        # 入口点选择上面配置的web入口点
        - "traefik.http.routers.http2https.entrypoints=web"
        # 路由中间件
        - "traefik.http.routers.http2https.middlewares=https-redirect"
        - "traefik.http.middlewares.https-redirect.redirectscheme.scheme=https"
        - "traefik.http.middlewares.https-redirect.redirectscheme.permanent=true"
        # 最最关键的一步，创建一个noop虚服务的loadbalancer，port随便选，不然上述重定向配置不会生效
        - "traefik.http.services.noop.loadbalancer.server.port=9999"

networks:
  traefik-net:
    external: true
```

更新*tutum/hello-world*的配置文件以支持https

```yaml
version: '3'
services:
  helloworld:
    image: tutum/hello-world:latest
    networks:
     - traefik-net
    deploy:
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.helloworld.rule=Host(`你的路由`)"
        # 将对外暴露点改为websecure
        - "traefik.http.routers.helloworld.entrypoints=websecure"
        # 与traefik配置里创建的resolver名字对应
        - "traefik.http.routers.helloworld.tls.certresolver=le"
        - "traefik.http.services.helloworld.loadbalancer.server.port=80"
networks:
  traefik-net:
    external: true
```

## 仪表盘配置

traefik2.x引入了一个全新的仪表盘可以快速查看配置, 仅有查看功能，个人认为用处不大。下面是其主界面图片

![traefik2.x dashboard示例](/img/traefik-dashboard.webp)

配置文件如下

```yaml
version: '3'

services:
  reverse-proxy:
    image: traefik:v2.3.1
    command:
      # 启用dashboard
      - "--api.dashboard=true"
      - "--providers.docker.swarmMode=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.network=traefik-net"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.le.acme.httpchallenge=true"
      - "--certificatesresolvers.le.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencryptresolver.acme.email=你的邮箱"
      - "--certificatesresolvers.letsencryptresolver.acme.storage=/letsencrypt/acme.json"
    ports:
      - 80:80
      - 443:443
    volumes:
      - traefik-certificates:/letsencrypt
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - traefik-net
    deploy:
      placement:
        constraints:
          - node.role == manager
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.http2https.rule=HostRegexp(`{any:.+}`)"
        - "traefik.http.routers.http2https.entrypoints=web"
        - "traefik.http.routers.http2https.middlewares=https-redirect"
        - "traefik.http.middlewares.https-redirect.redirectscheme.scheme=https"
        - "traefik.http.middlewares.https-redirect.redirectscheme.permanent=true"
        # dashboard配置
        - "traefik.http.routers.api.rule=Host(`你的路由`)"
        - "traefik.http.routers.api.entrypoints=websecure"
        - "traefik.http.routers.api.tls.certresolver=le"
        # 获取dashboard提供器
        # PS: @后面变量表示提供者, 像之前的hello-world实际上省略了@docker
        - "traefik.http.routers.api.service=api@internal"
        # 基本验证中间件
        - "traefik.http.routers.api.middlewares=api-auth"
        # 配置用户名密码
        # 这里默认是用户名密码都是admin
        # 可以用htpasswd(https://httpd.apache.org/docs/2.4/programs/htpasswd.html)生成用户名密码
        - "traefik.http.middlewares.api-auth.basicauth.users=admin:$$apr1$$8EVjn/nj$$GiLUZqcbueTFeD23SuB6x0"
        # 最最关键的一步，创建一个noop虚服务的loadbalancer，port随便选，不然上面的label配置不会生效
        - "traefik.http.services.noop.loadbalancer.server.port=9999"

networks:
  traefik-net:
    external: true
```

## 大功告成

到这里这篇教程就结束了，为了不增加文章的复杂度，我只介绍了基本的，一般使用够用的知识点，更多内容请参考官方文档。