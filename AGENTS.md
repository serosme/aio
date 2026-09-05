# Aio Agent Instructions

Aio 是个人使用的 Windows 桌面工具。实现功能时保持简单、直接，优先复用现有模块，不为了通用性增加额外抽象、防御性校验或复杂架构。

## 技术栈

- 前端：Nuxt 4.5、Vue 3、Vue Router 5、`@nuxt/ui` v4、Tailwind CSS v4
- 桌面：Electron 44；主进程使用 TypeScript，preload 使用 CommonJS
- 录音：Electron 主进程中的 `decibri`，16kHz、单声道、16-bit PCM
- 快捷键：Electron 主进程中的 `uiohook-napi`
- 语音识别：Nuxt `POST /api/asr` 调用阿里云百炼 ASR
- 剪贴板：Electron 内置 `clipboard`；`uiohook-napi` 模拟 `Ctrl+V`
- 音乐：`taglib-wasm` 2.x 读写 mp3/flac 标签，`@vueuse/core` 的 `useMediaControls` 播放
- 配置：`conf`，目录为 `~/.config/aio`
- 工具：`pinyin-pro`、`js-yaml`、`deepmerge`
- 构建：Nuxt Nitro 服务端输出 + electron-builder，Windows 输出 `release/*.zip`

## 常用命令

```text
npm run dev        启动 Nuxt 开发服务和 Electron
npm run lint       ESLint 检查
npm run lint:fix   ESLint 自动修复，项目唯一格式化命令
npm run typecheck  Nuxt / Vue TypeScript 检查
npm run build      Nuxt 构建并执行 electron-builder
npm run preview    构建后启动 Electron，不打包
npm run release    构建、打包并发布 GitHub Release（会重写 Git 历史）
npm run ncu        检查依赖更新
```

修改代码后运行 `npm run lint` 和 `npm run typecheck`。涉及 Electron 或打包流程时，再运行 `npm run build`。构建命令需要能够启动 esbuild 子进程，并可能需要下载 Electron 资源。

## 目录与职责

```text
app/
  app.vue                         根组件
  pages/command/index.vue        命令面板
  pages/music/index.vue           音乐播放器
  pages/test.vue                  测试页面
  command-groups/*.ts             命令面板分组，新增文件会自动发现
  components/                     LyricsPanel、MusicEdit、MusicInfo
  composables/                    useCommand、useMusic、useModalOpen
  utils/                          selfFetch、useSelfFetch
  assets/css/main.css             Tailwind / Nuxt UI 入口

server/
  api/                            Nuxt 文件路由
  api/asr.post.ts                 纯语音识别接口
  api/music/                      音乐列表、流、封面、信息、歌词、标签
  api/app、terminal、folder、command/
                                  Windows 应用、终端、文件夹和命令
  api/mihomo/                     Mihomo 启停管理
  utils/conf.ts                   conf 实例与配置 schema
  utils/recognize.ts              阿里云百炼 ASR 调用
  utils/music.ts                  音乐目录与文件路径
  utils/apps.ts、terminal.ts      Windows 信息读取
  utils/commands.ts、folders.ts  静态注册表
  utils/mihomo.ts                 Mihomo 进程和配置管理
  utils/open.ts                   外部进程启动

electron/
  main.ts                         Electron 入口、窗口和全局快捷键
  asr.ts                          uiohook、decibri、ASR 请求、剪贴板和粘贴
  windows.ts                      窗口工厂、同名窗口去重、DevTools 切换
  command/window.ts               命令面板窗口
  ipc/index.ts                    仅处理打开网页窗口的 IPC
  preload.cjs                     暴露 electronAPI.openWindow
  renderer.ts                     生产模式启动 Nitro
  ports.ts                        应用端口和基础 URL
  tray.ts                         系统托盘
  utils/logger.ts                 Electron 主进程日志

shared/
  types/                          前后端共享类型
  utils/logger.ts                 Nitro 侧日志

electron-builder.yml              打包配置
release.ts                        发布脚本
aio.json                          Scoop manifest
```

## Nuxt 约定

- `app/pages` 文件即页面路由，`server/api` 文件即 API 路由。
- Vue、Nuxt、Nuxt UI 组件以及 Nitro 服务端上下文中的 `server/utils` / `shared/utils` 导出可以自动导入。
- 被 `electron/**` 或 `modules/**` 直接引用的代码不要依赖 Nuxt 自动导入，使用显式 import；当前录音逻辑只在 Electron 主进程，不要重新放回 Nitro 插件。
- 样式使用 Tailwind class 和 Nuxt UI 的 `ui` 属性，不使用 Prettier。
- 页面 API 请求优先使用 `selfFetch` / `useSelfFetch`，以复用错误 Toast。
- 共享接口和数据结构放在 `shared/types`。

## Electron 约定

- 所有网页窗口通过 `electron/windows.ts` 的 `createWindow` 创建；窗口按名称去重，已存在时聚焦。
- 开发环境创建窗口时不自动打开 DevTools；`Ctrl+Shift+D` 切换当前聚焦窗口的 DevTools。
- `preload.cjs` 使用 CommonJS，只暴露必要的 `electronAPI`。
- 页面请求打开新窗口时走 `window.electronAPI.openWindow({ name, url })`，由主进程调用 `createWindow`。
- 应用端口固定为 2999。
- 生产模式由 Electron 设置 `NITRO_PORT` 并导入 `.output/server/index.mjs`；开发模式由 `nuxt dev` 提供服务，Electron 等待端口后启动。
- Electron 代码不在 Nuxt `typecheck` 范围内；修改 Electron 或原生模块后，除 lint 外还要实际启动或验证打包产物。

## 语音输入链路

录音、快捷键、识别后的剪贴板和粘贴全部在 Electron 主进程完成，不使用 ASR 页面、IPC 状态回传或 WebSocket。

1. Electron 启动后，`electron/asr.ts` 注册全局 Caps Lock 监听。
2. Caps Lock 按住超过 150ms 后，使用 `decibri` 打开麦克风并采集 PCM。
3. 松开 Caps Lock 后停止录音，将 PCM 封装为 WAV。
4. Electron 将 `{ audio: base64 }` POST 到 `/api/asr`。
5. `server/api/asr.post.ts` 解码音频并调用 `recognizeAudio`，返回 `{ text }`。
6. Electron 使用 `clipboard.writeText(text)` 写入剪贴板，再用 `uIOhook.keyTap` 模拟 `Ctrl+V`。

录音和识别期间不启动新的录音请求。不要把录音逻辑重新放到 `server/plugins` 或 Nuxt 页面。

## 音乐模块

- 音乐目录来自 `conf` 的 `music.path`，默认 `~/Music`，支持 mp3 和 flac。
- `server/utils/music.ts` 提供音乐目录与文件路径。
- API 负责列表、Range 音频流、封面、完整标签、歌词和标签读写。
- `useMusic` 负责播放、切歌、随机、循环、音量和歌词加载。
- `LyricsPanel` 解析 LRC，并根据播放时间滚动高亮。
- `MusicEdit` / `MusicInfo` 通过 `useModalOpen` 管理 Modal 状态。
- `taglib-wasm` 的文件读取、写入和封面操作放在 server 侧，不放入页面。

## 配置与日志

- 配置实例只定义在 `server/utils/conf.ts`，当前包括 `asr.key` 和 `music.path`。
- Nitro 侧使用 `shared/utils/logger.ts` 自动导入；Electron 主进程显式使用 `electron/utils/logger.ts`。
- 两份 logger 实现重复是有意设计，修改日志格式或落盘行为时同步修改。
- 日志写入终端以及 `~/.config/aio/logs/info.log`、`error.log`。

## 个人项目取舍

- 内部注册表、静态字典和受控参数可以直接使用，不增加 DTO、权限系统或通用异常框架。
- 只保留必要的真实边界处理：外部 API、文件读写、进程启动、端口探测和可能为空的用户输入。
- 优先在现有模块内修改，不擅自改变 API、配置字段或数据流。
- Electron 代码不在 Nuxt `typecheck` 范围内，修改后要通过 lint，并重点检查 Electron 运行时行为。
- 不要执行发布脚本，除非用户明确要求发布；发布脚本会修改 manifest、重写 Git 历史、强制推送分支和标签，并删除重建 GitHub Release。

## 构建与发布

- electron-builder 配置打包 `.output`、`config`、`electron` 和 `public`，Windows 目标为 zip，输出到 `release/`。
- 原生模块 `decibri`、`uiohook-napi` 使用预编译 N-API 包，当前 `npmRebuild: false`，不要随意改为重编译流程。
- `.output`、`.nuxt`、`.nitro`、`node_modules`、`release` 和日志文件不纳入 Git。
