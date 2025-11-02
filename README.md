# FrontEnd - 命定之诗与黄昏之歌

## 作者

Kitaikuyo，秋天的咸鱼，FL已躺平，yoyo514

## 概述

角色卡**命定之诗与黄昏之歌**的前端代码仓库，使用了青空莉的 [酒馆助手编写模板](https://github.com/StageDog/tavern_helper_template)

保留的模板说明文档 (不会更新): [模板说明](docs.md)

我对原模板有所修改，所以会和上面链接中的模板有差异

目前仅重构了状态栏部分

原 html 文件可在 `single_heml_backup` 目录中查看

打包的文件在 `dist` 目录中，可通过 jsDelivr 获取

[仓库打包目录 jsDelivr](https://testingcf.jsdelivr.net/gh/The-poem-of-destiny/FrontEnd-for-destined-journey/)

## 添加预设数据

**点击 [这里](./public/assets/data/README.md) 查看文档**

## 环境

- Node.js >= 22

## 运行

依次运行以下命令（仅打包）

```bash
pnpm i
pnpm build
```

因为模板是对应在酒馆中实时编写的，有很多和普通项目不同的地方，详细教程请查阅：[模板相关教程](https://stagedog.github.io/%E9%9D%92%E7%A9%BA%E8%8E%89/%E5%B7%A5%E5%85%B7%E7%BB%8F%E9%AA%8C/%E5%AE%9E%E6%97%B6%E7%BC%96%E5%86%99%E5%89%8D%E7%AB%AF%E7%95%8C%E9%9D%A2%E6%88%96%E8%84%9A%E6%9C%AC/)
