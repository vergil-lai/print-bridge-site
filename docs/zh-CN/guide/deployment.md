---
description: 在仓库、门店和工位部署 PrintBridge，配置默认打印机、白名单、远程任务、CLI 运维和加密配置导入导出。
---

# 部署与配置

PrintBridge 适合仓库、门店、生产工位等需要稳定静默打印的场景。一台电脑常驻 Agent，业务系统可以通过 SDK 直连，也可以让 Agent 主动拉取远程任务。

## 基础配置

每台运行 PrintBridge 的电脑至少需要确认：

1. 默认打印机。
2. 默认纸张。
3. 业务系统 Origin 白名单。
4. IP 白名单。
5. 远程任务轮询配置，如果使用远程任务模式。

## 配置导入导出

设置界面支持把部分配置导出为加密 JSON 文件，也可以从加密 JSON 文件导入配置。企业可以用它减少逐台手工配置成本。

适合迁移的配置包括：

- 本地端口。
- Origin 白名单列表。
- 远程任务开关。
- 远程任务 URL。
- 远程任务 Authorization Token。
- 轮询时间。
- 上报重试次数。

导出文件默认名为：

```text
printbridge-config.json
```

导入时，PrintBridge 会先展示预览，确认后只覆盖文件中包含的配置项。文件中没有包含的配置会保留现有值。

## CLI 运维

PrintBridge 提供 `print-bridge` CLI，用于在不打开 GUI 的情况下完成基础运维和诊断：

```bash
print-bridge printer
print-bridge printer set-default "Printer Name"

print-bridge paper
print-bridge paper set 60 40

print-bridge origin add "https://erp.example.com"

print-bridge remote set-url "https://example.com/print-task"
print-bridge remote enable

print-bridge task
```

CLI 直接读写与 GUI 相同的本机配置，适合批量部署、远程协助和无 GUI 环境。

## 远程任务轮询

远程任务轮询适合“业务服务器集中生成任务，工位 Agent 自动打印”的模式。

```text
业务服务器
  |
  | Agent 定时拉取待打印任务
  v
PrintBridge Agent
  |
  | 下载、转换、排队、提交打印
  v
系统打印队列
```

这种模式适合仓库标签、门店小票、生产工位标签和拣货单等场景。

## 批量部署建议

- 先在一台样板机器配置默认打印机、纸张、白名单和远程任务。
- 导出加密配置包。
- 在其他工位导入配置包。
- 使用 CLI 检查打印机、纸张和远程任务开关。
- 在业务系统侧控制设备编号、用户权限和任务来源。
