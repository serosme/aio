# AGENTS

**Nuxt 4 + Electron** 桌面应用

**技术栈：**

| 层面      | 技术                                                                |
| --------- | ------------------------------------------------------------------- |
| 前端框架  | Nuxt 4 + Vue 3（内置 Vue Router 5）                                 |
| UI 组件   | `@nuxt/ui` v4（基于 Tailwind CSS v4）                               |
| 音频处理  | MediaRecorder 浏览器录音（webm/opus 原生输出）                      |
| 桌面壳    | Electron 43                                                         |
| 键盘监听  | `uiohook-napi`（Nitro 服务端插件，全局级）                          |
| 语音识别  | 页面录音 → HTTP 调识别接口 → 结果经 WebSocket 回传粘贴              |
| 剪贴板    | `@napi-rs/clipboard`（N-API 预编译，纯 Node 原生 API）              |
| 拼音搜索  | `pinyin-pro`（支持全拼 / 首字母模糊）                               |
| 持久化    | `conf` npm 包（存储于 `~/.config/aio`）                             |
| 图标集    | Lucide（@iconify-json/lucide）                                      |
| HTTP 请求 | `selfFetch`（基于 `$fetch` 的封装，自动错误 Toast）                 |
| YAML 处理 | `js-yaml` + `deepmerge`（Mihomo 配置合并）                          |
| 音乐标签  | `taglib-wasm`（mp3/flac 元数据读取、写入、封面提取）                |
| 工具库    | `@vueuse/core`（useUserMedia / useWebSocket / useMediaControls 等） |
| 日志      | 自研 logger（双文件，无第三方依赖）                                 |
| 构建打包  | electron-builder，产出 `release/*.zip`                              |
| 版本发布  | GitHub Releases + Scoop manifest (`aio.json`) 自动更新              |

## 开发命令

| 命令                | 作用                              | 备注                                                         |
| ------------------- | --------------------------------- | ------------------------------------------------------------ |
| `npm run dev`       | 并行启动 Nuxt + Electron 开发模式 | 依赖 `electron/wait.mjs` 等待 dev server 就绪（默认 2999）   |
| `npm run build`     | Nuxt 构建 → electron-builder 打包 | 产物输出到 `release/`                                        |
| `npm run preview`   | 构建后直接启动 Electron（不打包） | 快速验证生产构建                                             |
| `npm run release`   | 构建 → 打包 → 发布 GitHub Release | 依次执行 `nuxt build`、`electron-builder`、`node release.ts` |
| `npm run lint`      | ESLint 检查                       | `@antfu/eslint-config`                                       |
| `npm run lint:fix`  | ESLint 自动修复                   | **唯一格式化命令**，无 Prettier                              |
| `npm run typecheck` | Nuxt TypeScript 类型检查          | 基于 `vue-tsc`，引用 `.nuxt/` tsconfig                       |
| `npm run ncu`       | 检查依赖更新                      | `npm-check-updates`                                          |
| `npm run ncuu`      | 升级所有依赖                      | —                                                            |

## 目录结构

```text
aio/
├── electron/             # 主进程
│   ├── main.ts           # 入口 — app 生命周期、全局快捷键注册
│   ├── ipc/              # IPC handler
│   │   └── index.ts      # registerIpcHandlers（window:open → createWindow）
│   ├── preload.cjs       # contextBridge 暴露 electronAPI.openWindow（CJS，sandbox 兼容）
│   ├── renderer.ts       # 生产模式下加载 Nuxt 服务端入口
│   ├── tray.ts           # 系统托盘 — 窗口管理菜单 + 退出
│   ├── windows.ts        # 窗口工厂 — createWindow（同名去重聚焦）/ toggleWindow / toggleDevTools
│   ├── command/
│   │   └── window.ts     # 命令窗口创建（标题栏隐藏、不显示任务栏、挂载 preload）
│   ├── asr/
│   │   └── window.ts     # 语音输入窗口创建（启动时后台创建、隐藏不占任务栏）
│   ├── ports.ts         # 端口统一来源 — getAppPort / getAppBaseUrl（DEV_PORT 默认 3000）
│   ├── wait.mjs         # dev 脚本：http 轮询等待 dev server 就绪（DEV_PORT 默认 2999）
│   └── utils/
│       └── logger.ts     # 主进程日志（显式 import）
├── app/                  # 前端（Nuxt 渲染进程）
│   ├── app.vue           # 根组件 — <UApp> 包裹 <NuxtPage>
│   ├── pages/
│   │   ├── asr.vue       # 语音输入页面（后台常驻：录音 + 识别结果）
│   │   ├── command/      # 命令面板页面
│   │   └── music/        # 音乐播放器页面（列表 + 播放控制条）
│   ├── command-groups/   # 命令面板可插拔组件组（7 组，见下）
│   ├── components/
│   │   ├── LyricsPanel.vue # 歌词滚动（UCarousel + LRC 解析 + 当前行居中高亮）
│   │   ├── MusicEdit.vue # 音乐标签编辑 Modal
│   │   └── MusicInfo.vue # 音乐元数据详情 Modal
│   ├── composables/
│   │   ├── useCommand.ts    # 命令面板 — import.meta.glob 自动发现 command-groups/
│   │   ├── useVoiceInput.ts # 语音输入 — 录音/识别/WS 回传，暴露 recording / result / start / stop
│   │   ├── useMusic.ts      # 音乐播放 — useMediaControls 封装（src/cover/播放控制/音量）
│   │   └── useModalOpen.ts  # Modal 打开状态同步（props.open ↔ emit + 打开时回调）
│   ├── utils/
│   │   ├── selfFetch.ts      # $fetch 封装（自动错误 Toast）
│   │   └── useSelfFetch.ts   # useFetch 封装（基于 selfFetch）
│   └── assets/css/
│       └── main.css      # Tailwind v4 + @nuxt/ui 入口
├── server/               # Nitro 服务端
│   ├── api/
│   │   ├── app/          # GET 获取应用列表 / GET 打开应用
│   │   ├── asr/          # ASR 识别接口：POST /api/asr（音频 → 文字）
│   │   ├── terminal/     # GET 获取终端列表 / GET 打开终端
│   │   ├── conf/         # GET 读取配置项
│   │   ├── command/      # GET 获取命令列表 / GET 执行命令
│   │   ├── folder/       # GET 获取文件夹列表 / GET 打开文件夹
│   │   ├── mihomo/       # GET 启动 / GET 停止
│   │   ├── service/      # GET 服务列表 / GET 启动 / GET 停止
│   │   ├── music/        # 音乐：列表 / stream / cover / info / tags（读写清）/ lyrics
│   │   └── ws/           # WebSocket 端点：/api/ws/asr（识别结果回传粘贴）
│   ├── plugins/
│   │   └── uiohook.ts    # 全局键盘监听（Caps Lock 长按 → WS 广播通知页面录音）
│   └── utils/
│       ├── conf.ts       # conf 实例（schema 定义，存储于 ~/.config/aio）
│       ├── paste.ts      # setClipboard（剪贴板写入）+ pasteFromClipboard（模拟 Ctrl+V）
│       ├── recognize.ts  # 阿里云百炼 ASR 识别（音频 → 文字）
│       ├── wsClients.ts  # WebSocket 连接注册表 + broadcastWs 广播
│       ├── terminal.ts   # Windows Terminal 读取（settings.json 解析）
│       ├── apps.ts       # Get-StartApps 获取应用（列表重读覆盖缓存，open 读缓存）
│       ├── commands.ts   # 预定义 PowerShell 脚本（Update-All 等）
│       ├── folders.ts    # 常用文件夹路径映射
│       ├── mihomo.ts     # Mihomo 代理管理器（provider.yaml + custom.yaml 合并、提权启动、停止）
│       ├── services.ts   # 服务注册表 + 运行检测 + 启动/停止（Service 模块）
│       ├── open.ts       # openProcess — 外部进程启动（detached + unref）
│       └── music.ts      # musicDir / musicPath（音乐目录与文件路径）
├── shared/               # 前后端共享
│   ├── types/            # application.ts / conf.ts / electron.d.ts / music.ts / service.ts / ws.ts
│   └── utils/
│       └── logger.ts     # 服务端日志（Nuxt 自动导入，无需 import）
├── public/               # 静态资源（favicon.ico 用于托盘图标）
├── release.ts            # 发布脚本（版本号生成、SHA256、GitHub Release）
├── aio.json              # Scoop manifest
└── electron-builder.yml  # 打包配置
```

## Nuxt 4 约定

- **自动导入**：代码中未显式 `import` 的 Vue / Nuxt API、`@nuxt/ui` 组件、`server/utils/` 下的导出以及 `shared/utils/` 下的导出，均依赖 Nuxt 4 自动导入机制
- **文件即路由**：`app/pages/` 下的 Vue 文件自动映射为前端页面路由；`server/api/` 下的文件映射为后端 API 路由
- **共享类型**：`shared/types/*.ts` 的导出在 app 与 server 侧均可直接使用（类型自动导入）

## 关键约定

### 格式化与样式

- **格式**：仅 ESLint（`eslint-plugin-format`），无 Prettier
- **CSS**：Tailwind v4 + `@nuxt/ui`，通过 `class` / `ui` 属性
- **VSCode**：`.vscode/settings.json` 已配置保存时 ESLint 自动修复、Prettier 禁用、Tailwind CSS 关联
- **例外**：`electron/utils/logger.ts` 与 `shared/utils/logger.ts` 通过文件顶部 `/* eslint-disable no-console */` 局部豁免 console，不改全局规则

### 渲染进程 ↔ 主进程（IPC 桥）

命令面板（渲染进程）通过 preload 暴露的桥直接请求主进程创建窗口，不经 Nitro：

1. `electron/preload.cjs`：`contextBridge.exposeInMainWorld('electronAPI', { openWindow })`（CJS 是 sandbox 模式要求）
2. 主进程 `electron/ipc/index.ts`：`ipcMain.handle('window:open', ...)` → `createWindow(name, url, { width: 1440, height: 900, titleBarStyle: 'hidden', titleBarOverlay: { color: '#FFFFFF', symbolColor: '#000000' } })`
3. 类型：`shared/types/electron.d.ts` 声明 `Window.electronAPI`（全局），渲染进程侧 `window.electronAPI?.openWindow({ name, url })`
4. 网页窗口**同名去重**：重复打开同一页面聚焦已有窗口

### 日志系统（自研）

- **两份相同实现**：`electron/utils/logger.ts`（主进程，显式 import）与 `shared/utils/logger.ts`（服务端，Nuxt 自动导入）——内容重复是有意取舍，**修改需同步两处**
- **双写**：终端 + 文件
- **双文件**（`~/.config/aio/logs/`）：
  - `info.log`：Info 及以上（Info + Error 都写入）
  - `error.log`：仅 Error
- **无轮转**；写文件失败兜底 `console.error`
- 服务端侧（`server/utils/*`、`server/api/*`）直接使用 `logger`，无需 import

### 服务管理（Service 模块）

通用服务注册表，当前注册 `dsh web`（DeepSeek Harness，端口 3080）：

- **注册表**：`server/utils/services.ts` 的 `services` 数组，条目 `{ id, name, command, port }`，服务地址约定为 `http://127.0.0.1:<port>`
- **API**：
  - `GET /api/service` → `ServiceItem[]`（完整注册表条目，含 command / port）
  - `GET /api/service/start?id=xxx` → 已在运行则 500「服务已启动」
  - `GET /api/service/stop?id=xxx` → 已停止则 500「服务已停止」
- **运行检测**：`fetch('http://127.0.0.1:<port>')`，任意 HTTP 响应（含 4xx/5xx）视为运行中
- **启动**：`spawn(command, { shell: true, stdio: 'ignore', windowsHide: true })`——**不要加 `detached`**（Windows 上 detached 会强制新建控制台窗口，windowsHide 失效）；命令含参数时整体写进 `command` 字符串（shell 模式传 args 数组会触发 DEP0190 警告）
- **停止**：`netstat -ano` 定位监听端口的 pid → `taskkill /pid <pid> /T /F`（进程树强杀）
- **命令面板**：`Services` 组（`app/command-groups/services.ts`），每个服务「启动 / 停止」子项，错误经 `selfFetch` 自动 Toast

### 语音输入（页面录音 + 识别接口 + 结果回传粘贴）

录音发生在**页面**（useUserMedia + MediaRecorder），识别由前端调 HTTP 接口完成，服务端只做按键检测与结果粘贴：

- **按键检测**：`server/plugins/uiohook.ts`（`uiohook-napi` 全局级），长按 150ms → 广播 `voice-start`；松开（恢复大小写后）→ 广播 `voice-stop`
- **页面录音**：`useVoiceInput` 组合式（`app/composables/useVoiceInput.ts`，`app/pages/asr.vue` 使用，暴露 `recording` / `result` / `start` / `stop`）收到 `voice-start` → useUserMedia（vueuse 封装 getUserMedia）+ MediaRecorder（`audio/webm;codecs=opus` 原生编码）→ Blob → Base64
- **识别**：页面（`app/pages/asr.vue`）停止录音后 `selfFetch` 调 `POST /api/asr`（`server/api/asr/index.post.ts` 解码 Base64 → `server/utils/recognize.ts` 调阿里云百炼 ASR，固定 `format: 'webm'` 不传采样率），失败时 selfFetch 自动弹错误提示
- **回传**：识别成功 → 页面经 WebSocket（`/api/ws/asr`）发 `{ type: 'result', text }`；服务端 `server/api/ws/asr.ts` 收到 → `setClipboard` 写入剪贴板（`@napi-rs/clipboard`），仅生产实例（无 `DEV_PORT`）执行 `pasteFromClipboard`（模拟 Ctrl+V），开发实例只写剪贴板不粘贴 → 广播 `voice-result` 给所有页面展示
- **连接注册表**：`server/utils/wsClients.ts` 维护在线 peer，`broadcastWs` 供任意服务端模块主动推送

### 音乐模块（taglib-wasm + useMediaControls）

本地音乐库，基于 `conf` 的 `music.path` 目录（默认 `~/Music`），支持 mp3 / flac：

- **路径工具**：`server/utils/music.ts` 导出 `musicDir` 与 `musicPath(id)`，供所有音乐 API 复用
- **API**：
  - `GET /api/music` → `Music[]`：遍历目录，taglib-wasm 读标签与时长
  - `GET /api/music/stream?id=` → 音频流，支持 Range 请求（206 分段）
  - `GET /api/music/cover?id=` → 封面图片（FrontCover 优先，Cache-Control 一年）
  - `GET /api/music/info?id=` → 完整标签（`sanitize` 将二进制字段替换为占位描述）
  - `GET /api/music/tags?id=` → `{ title, artist, album }`
  - `PUT /api/music/tags` → 写回标签；`DELETE /api/music/tags` → 清除标签
  - `GET /api/music/lyrics?id=` → `{ text }`：读取歌词（taglib `lyrics` 字段，多个条目以空行分隔）
- **前端**：`useMusic`（`app/composables/useMusic.ts`）封装 `useMediaControls`，提供列表/播放/上下曲/随机/循环/音量；`app/pages/music/index.vue` 为 UTable 列表 + 底部播放器控制条；`LyricsPanel`（`app/components/LyricsPanel.vue`）解析 LRC 用 UCarousel 垂直滚动，当前行居中高亮
- **Modal 复用**：`MusicEdit` / `MusicInfo` 通过 `useModalOpen`（`app/composables/useModalOpen.ts`）同步 `props.open` ↔ emit，并在打开时加载数据

### 窗口管理

所有窗口通过 `electron/windows.ts` 的 `createWindow(name, url, options, devtools = true)` 统一创建，**同名窗口存在时聚焦而非新建**。窗口关闭时自动从 `windows` Map 移除并更新托盘菜单。`devtools` 控制 dev 模式下是否自动打开 DevTools，后台窗口（语音输入）传 `false`。

| 窗口名            | 路由       | 特性                                                                                                           |
| ----------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `Command Palette` | `/command` | 标题栏隐藏（`titleBarStyle: hidden`）、不在任务栏显示、失焦隐藏                                                |
| `ASR`             | `/asr`     | 启动时后台创建（`show: false`、不占任务栏、关闭后台节流），常驻录音与识别；`devtools: false` 不自动开 DevTools |

网页窗口（`window:open` IPC 创建）：常规窗口，默认 1440×900，可缩放，显示在任务栏。

### 系统托盘

`electron/tray.ts` 使用 `public/favicon.ico` 作为图标，右键菜单列出所有活跃窗口的显示/隐藏/关闭操作，以及退出应用选项。

### 快捷键

| 快捷键           | 作用          | 实现                                       |
| ---------------- | ------------- | ------------------------------------------ |
| `Alt+Space`      | 切换命令面板  | `globalShortcut.register`                  |
| `Ctrl+Shift+D`   | 打开 DevTools | `globalShortcut.register`                  |
| `Caps Lock 长按` | 语音输入      | `server/plugins/uiohook.ts` 150ms 长按检测 |

### 语音识别链路

1. `server/plugins/uiohook.ts`（`uiohook-napi`）检测 Caps Lock 长按 150ms → `broadcastWs` 广播 `voice-start`
2. 页面（`app/pages/asr.vue`）收到 `voice-start` → useUserMedia（vueuse）+ MediaRecorder 录音（`audio/webm;codecs=opus`）
3. 松开 Caps Lock → 50ms 延迟后模拟一次 Caps Lock 按键恢复大小写状态 → 广播 `voice-stop`
4. 页面停止录音：Blob → Base64 → `selfFetch` 调 `POST /api/asr`（服务端 `asr/index.post.ts` → `recognizeAudio` 调阿里云百炼 ASR，固定 `format: 'webm'`）
5. 识别成功 → 页面显示结果，经 WebSocket 发 `{ type: 'result', text }`；失败 → selfFetch 自动弹错误提示
6. 服务端收到 `result` → `server/utils/paste.ts` 的 `setClipboard` 写剪贴板（`@napi-rs/clipboard`）；仅生产实例（无 `DEV_PORT`）执行 `pasteFromClipboard` 模拟 Ctrl+V 粘贴（开发实例写剪贴板但不粘贴）→ 广播 `voice-result` 给所有页面

### 命令面板

- `<UCommandPalette>` + `useCommand` 组合函数
- **可插拔架构**：`useCommand` 通过 `import.meta.glob` 自动发现 `app/command-groups/` 下所有 `.ts` 文件作为组件组，各文件默认导出 `{ id, label, order, items }` 并按 `order` 排序
- **7 个组件组：**

  | 组 ID          | 数据来源            | 动作                                                                                     |
  | -------------- | ------------------- | ---------------------------------------------------------------------------------------- |
  | `applications` | `GET /api/app`      | `explorer.exe shell:AppsFolder`                                                          |
  | `terminals`    | `GET /api/terminal` | `wt.exe -p profile`                                                                      |
  | `folders`      | `GET /api/folder`   | `explorer.exe folderPath`                                                                |
  | `commands`     | `GET /api/command`  | `wt.exe powershell -NoExit -EncodedCommand`（wt 不可用时回退 `powershell.exe -Command`） |
  | `mihomo`       | 静态定义（含子项）  | `GET /api/mihomo/start\|stop`                                                            |
  | `websites`     | 静态定义            | `window.electronAPI.openWindow`（新窗口 1440×900，同名去重聚焦）                         |
  | `services`     | `GET /api/service`  | `GET /api/service/start\|stop`（启动/停止子项）                                          |

- **应用列表缓存**：`GET /api/app` 每次调用重读 `Get-StartApps` 并覆盖服务端缓存；`GET /api/app/open` 只从缓存取 AppID，不再枚举。新装应用在 DevTools（Ctrl+Shift+D）里 F5 刷新页面即可生效
- 应用名通过 `pinyin-pro` 生成全拼/首字母作为 Fuse.js 搜索 `keywords`
- 搜索配置：`matchAllWhenSearchEmpty: false`，搜索 `label`、`suffix`、`keywords` 字段
- `resultLimit`：`useCommand` 以 `websites` 组条目数作为全局搜索结果上限，避免应用列表淹没结果
- `preserve-group-order`：保持组件组声明顺序，不被搜索命中数重排
- `@keydown.space.prevent` 阻止空格触发选中
- 选中后自动重置面板（`resetPalette`：清空搜索词 + `paletteKey++` 强制重新挂载）

### 代码修改约束

修改代码后，必须依次执行以下命令，根据反馈修复所有问题，直至全部通过：

- `npm run lint` — ESLint 检查
- `npm run typecheck` — Nuxt TypeScript 类型检查

### HTTP 请求封装

- **`selfFetch`**（`app/utils/selfFetch.ts`）：基于 `$fetch.create()`，自动处理 `onResponseError`，通过 `useToast()` 显示错误提示
- **`useSelfFetch`**（`app/utils/useSelfFetch.ts`）：基于 `createUseFetch`，将 `useFetch` 的底层 `$fetch` 替换为 `selfFetch`，使所有 `useFetch` 调用自动享有错误处理

### 配置系统

- **存储**：`conf` 包，数据目录 `~/.config/aio`
- **Schema**：定义于 `server/utils/conf.ts`，含 `asr.key`（阿里云百炼 API Key）与 `music.path`（音乐目录，默认 `~/Music`）
- **API**：`GET /api/conf?name=asr` 读取配置（`server/api/conf/index.get.ts`）
- **自动导入**：`server/utils/conf.ts` 的 `default export`（`conf` 实例）在 `server/api/` 下自动可用

### 端口约定

应用自身 Nuxt/Nitro 服务端口由环境变量控制，主进程统一经 `electron/ports.ts` 的 `getAppPort` / `getAppBaseUrl` 读取：

- **`DEV_PORT`**：开发端口，由 `package.json` 的 dev 脚本 `cross-env DEV_PORT=3000` 注入（改脚本里的数字即替换开发端口）；`nuxt dev` 经 `nuxt.config.ts` 的 `devServer.port` 读取，`scripts/wait.mjs` 轮询同一变量
- **内置默认 2999**：生产打包后无环境变量时兜底（`getAppPort` / `devServer.port` / `wait.mjs` 一致），`electron/renderer.ts` 启动生产 Nitro 时写入 `NITRO_PORT`
- **环境判定**：`process.env.NODE_ENV !== 'dev'` 视为生产（dev 由 `cross-env NODE_ENV=dev` 显式设置，打包运行后为空）
- 渲染进程访问本应用统一用 `window.location.origin`（`app/command-groups/websites.ts`），不依赖端口常量
- 外部服务端口（如 DeepSeek Harness 3080）与 `server/utils/services.ts` 注册表约定，保持硬编码

### 自用简化约定

本项目为个人自用工具，已按此原则移除防御性编程：

- 内部数据（静态字典/注册表/刚枚举的缓存/配置）不校验：`getService` / `getCommandScript` / `getFolderPath` / `getAppId` 均为非空断言返回，`conf` 读取不做 `has()` 校验（传错 id 直接 500 / 返回 undefined）
- 保留真实边界处理：外部进程（`child.on('error')`、taskkill 状态检查）、外部文件（`terminal.ts` 的 catch）、外部 API（`recognize.ts` 的 key/result 检查）、运行探测（`isServiceRunning` 的 try/catch）
- 窗口层不检查 `isDestroyed`（`closed` 事件保证 Map 内均为活窗口）

### 构建与打包

- `electron-builder.yml` 配置：输出到 `release/`，仅 `zip`，包含 `.output/`、`electron/`、`public/`
- `.gitignore` 忽略：`.output`、`.nuxt`、`.data`、`.nitro`、`.cache`、`dist`、`node_modules`、`release/`、`logs`、`*.log`、`.env*`（保留 `.env.example`）
- `tsconfig.json` 引用 `.nuxt/` 下自动生成的四个 tsconfig 文件；`typecheck` 使用 `vue-tsc`（注意：`electron/**` 不在任何 tsconfig 检查范围内）
- `package.json` 的 `allowScripts` 已授权 `uiohook-napi`、`esbuild`、`electron-winstaller` 等原生模块编译
- **原生模块机制**：`uiohook-napi` / `@napi-rs/clipboard` 均为 **N-API 预编译**（平台二进制经 optionalDependencies 自动安装，`npmRebuild: false` 无需重编译），electron-builder 自动将 `.node` 文件解包至 `app.asar.unpacked`

### 发布流程

`npm run release` → 依次执行 `nuxt build`、`electron-builder` → `release.ts` 执行以下步骤：

1. 按时间戳生成版本号（`YYYYMMDDHHmmss`）
2. 计算 `release/Aio-win-x64.zip` 的 SHA256
3. 更新 `aio.json` 的 `version` 和 `hash`
4. `git update-ref -d HEAD` 丢弃历史 → `git add -A` → `git commit` → `git push --force`（单提交）
5. 删除旧 `latest` tag/release → 创建新 tag → `gh release create` 上传 zip

`aio.json` 为 Scoop 包管理器的 manifest 文件，指向 GitHub Release 的下载地址。
