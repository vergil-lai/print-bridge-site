---
title: PrintBridge - 开源 Web 静默打印代理
titleTemplate: false
layout: home
heroCarousel: true
description: PrintBridge 是连接 Web 应用与本地打印机的开源打印代理，支持 SDK 静默打印、远程任务轮询、raw 指令、配置导入导出和企业私有化部署。

hero:
    name: "PrintBridge"
    text: "一个连接 Web 应用与本地打印机的开源打印代理，让网页系统实现静默打印。"
    tagline: 运行在用户电脑上的开源本机打印 Agent。受信任的 ERP、WMS、OMS 或收银系统可以通过 SDK 连接本机 Agent，把 PDF、图片、Office 文件和 raw 指令提交到系统打印队列。
    actions:
        - theme: brand
          text: 下载 PrintBridge
          link: /zh-CN/download
        - theme: alt
          text: 查看 SDK 接入
          link: /zh-CN/guide/sdk

features:
    - title: 本机 Agent
      details: PrintBridge 常驻用户电脑，负责接收任务、校验来源、下载或转换文件，并提交到系统打印队列。
    - title: 浏览器 JSSDK
      details: Web 页面通过 print-bridge-sdk 连接本机 WebSocket 服务，下发单个或批量打印任务。
    - title: 多种打印格式
      details: 支持 PDF、PNG/JPEG 图片、Office 文件，以及 ESC/POS、TSPL、ZPL、EPL、PCL 等 raw 指令。
    - title: Desktop 与 Headless
      details: 提供 Windows、macOS、Linux Desktop，以及自动接入 systemd 的 Linux Headless 产品；两者共用 CLI，但不能同时安装。
    - title: 远程打印任务
      details: 业务服务器集中生成任务，本机 Agent 定时拉取、下载、排队打印，并把 accepted、success 或 failed 状态回报给服务器。
    - title: 开源可私有化
      details: 可自托管、可审计、可二次集成，适合接入企业自有 ERP、WMS、OMS 或收银系统。
---
