# Aio Agent Instructions

Aio 是个人使用的 Windows 桌面工具。实现功能时保持简单、直接，优先复用现有模块，不为了通用性增加额外抽象或复杂架构。

## 功能

功能编号用于和下面的目录树对应。目录树中的每个源码文件都标注了所属功能编号。

- **F1 Electron 应用运行时**：负责应用启动、Nitro 服务、单实例、窗口创建与复用、系统托盘、全局快捷键、页面 IPC 和 DevTools。
- **F2 命令面板**：提供统一搜索入口，聚合应用、文件夹、预设命令、网页和 Mihomo 操作。
- **F3 应用启动**：读取 Windows 开始菜单应用列表，并通过 AppID 打开应用。
- **F4 文件夹打开**：打开 Desktop、Downloads、Documents、AppData 等预设目录。
- **F5 预设命令执行**：通过 Windows Terminal 执行 DeepSeek Harness、Scoop、Mise、Npm、Winget 等命令。
- **F6 网页窗口入口**：从命令面板打开 Chat、Music 和 Test 页面，并为页面创建独立窗口。
- **F7 全局语音输入与 ASR**：长按 Caps Lock 录音，调用火山引擎豆包大模型流式语音识别（`bigmodel_nostream`，流式输入返回整句结果，模型资源 ID 固定为 2.0 小时版），将文本写入剪贴板并自动粘贴。
- **F8 Chat 对话**：调用 OpenAI Compatible API，支持模型列表按 ID 倒序展示、提示词、流式回复、Comark 流式 Markdown 渲染、停止、重新生成和新建对话（清空当前消息，不保存会话历史）。
- **F9 AI 工具**：为 Chat 提供受控工具调用，目前包含获取当前时间。
- **F10 音乐库与播放器**：扫描 MP3/FLAC，播放音频，控制进度、音量、静音、切歌、随机和循环。
- **F11 音乐信息与标签**：读取封面、歌词和元数据，查看详细信息，编辑或清除标签。
- **F12 歌词同步显示**：解析 LRC 歌词，根据播放进度高亮当前歌词并滚动定位。
- **F13 Mihomo 管理**：启动、停止 Mihomo，支持普通模式、TUN 提权模式和 YAML 配置合并。
- **F14 配置管理**：持久化 ASR、音乐和 Chat 配置，并提供服务端读取接口。
- **F15 日志与请求错误处理**：记录 Nitro 和 Electron 日志，统一处理前端 API 请求错误。
- **F16 测试与实验页面**：提供临时测试页面和命令面板入口。
- **F17 工程构建与发布**：负责 Nuxt 配置、类型检查、ESLint、编辑器配置、Electron Builder、Scoop manifest、发布脚本和忽略规则。

### 目录与功能对应

```text
.
├─ app/                                      # F1/F2/F6/F8/F10/F11/F12/F15/F16：Nuxt 前端
│  # 目录中各文件的具体功能见下方文件注释
│  ├─ app.vue                                 # F1：Nuxt 根组件，挂载 UApp 和页面路由
│  ├─ assets/                                  # F17：前端静态资源
│  │  └─ css/                                  # F17：全局样式
│  │     └─ main.css                           # F17：Tailwind、Nuxt UI 和全局基础样式
│  ├─ command-groups/                         # F2：命令面板的自动发现命令组
│  │  ├─ apps.ts                              # F2/F3：应用列表、拼音搜索和应用启动
│  │  ├─ commands.ts                          # F2/F5：预设命令和更新命令
│  │  ├─ folders.ts                           # F2/F4：常用文件夹列表和打开操作
│  │  ├─ mihomo.ts                            # F2/F13：Mihomo 子集，普通开启、TUN 开启和关闭
│  │  └─ websites.ts                          # F2/F6/F16：Chat、Music、Test 页面入口
│  ├─ components/                             # F10/F11/F12：音乐页面子组件
│  │  ├─ LyricsPanel.vue                      # F12：LRC 解析、歌词高亮和自动滚动
│  │  ├─ MusicEdit.vue                        # F11：音乐标题、艺术家、专辑和歌词编辑
│  │  └─ MusicInfo.vue                        # F11：展示音乐完整元数据
│  ├─ composables/                            # F2/F10/F11：前端状态和行为复用
│  │  ├─ useCommand.ts                        # F2：加载命令组、排序、搜索和重置
│  │  ├─ useModalOpen.ts                      # F11：音乐 Modal 的打开状态和回调
│  │  └─ useMusic.ts                          # F10/F12：音频控制、切歌、播放状态和歌词加载
│  ├─ pages/                                  # F2/F6/F8/F10/F16：Nuxt 文件路由页面
│  │  ├─ chat/                                 # F8：Chat 对话页面
│  │  │  └─ index.vue                         # F8：Chat 界面、Comark Markdown 消息渲染、新建对话、模型和提示词选择
│  │  ├─ command/                              # F2：命令面板页面
│  │  │  └─ index.vue                         # F2：命令搜索面板
│  │  ├─ music/                                # F10/F11/F12：音乐功能页面
│  │  │  └─ index.vue                         # F10/F11/F12：音乐列表、播放器和歌词页面
│  │  └─ test.vue                             # F16：临时测试页面
│  └─ utils/                                  # F15：前端请求封装
│     ├─ selfFetch.ts                         # F15：统一 API 错误 Toast
│     └─ useSelfFetch.ts                      # F15：组合式请求封装
├─ electron/                                  # F1/F7：Electron 主进程与桌面能力
│  ├─ asr.ts                                  # F7：Caps Lock 监听、录音、ASR、剪贴板和粘贴
│  ├─ command/
│  │  └─ window.ts                            # F1/F2：创建命令面板窗口
│  ├─ ipc/
│  │  └─ index.ts                             # F1/F6：处理打开应用内网页窗口的 IPC
│  ├─ main.ts                                 # F1/F7：应用生命周期、快捷键、托盘和初始化
│  ├─ ports.ts                                # F1/F17：应用端口和基础 URL
│  ├─ preload.cjs                             # F1/F6：通过 contextBridge 暴露 electronAPI
│  ├─ renderer.ts                             # F1/F17：生产模式启动 Nitro
│  ├─ tray.ts                                 # F1：系统托盘及窗口菜单
│  ├─ utils/
│  │  └─ logger.ts                            # F15：Electron 日志
│  └─ windows.ts                              # F1/F6：窗口注册、复用、显示隐藏和 DevTools
├─ server/                                    # Nitro 服务端：F3/F4/F5/F7/F8/F9/F11/F13/F14/F15
│  ├─ api/                                    # F3/F4/F5/F7/F8/F11/F13/F14：HTTP API
│  │  ├─ app/                                 # F3：Windows 应用查询和启动 API
│  │  │  ├─ index.get.ts                      # F3：获取 Windows 应用名称列表
│  │  │  └─ open.get.ts                       # F3：按名称打开 Windows 应用
│  │  ├─ asr/                                 # F7：全局语音输入 API
│  │  │  └─ index.post.ts                     # F7：接收裸 PCM，走火山豆包流式 ASR（WebSocket）返回整句结果
│  │  ├─ chat/                                # F8/F9：Chat 对话和 AI 工具 API
│  │  │  ├─ index.post.ts                     # F8/F9：流式 Chat、system prompt 和工具编排
│  │  │  ├─ models.get.ts                      # F8：获取并按模型 ID 倒序返回 OpenAI Compatible 模型列表
│  │  │  └─ prompts.get.ts                     # F8：内置 Chat 提示词注册表
│  │  ├─ command/
│  │  │  └─ open.get.ts                        # F5：打开 Windows Terminal 执行预设命令
│  │  ├─ conf/
│  │  │  └─ index.get.ts                       # F14：按名称读取配置
│  │  ├─ folder/
│  │  │  ├─ index.get.ts                       # F4：获取预设文件夹名称
│  │  │  └─ open.get.ts                        # F4：打开指定预设文件夹
│  │  ├─ mihomo/
│  │  │  ├─ start.get.ts                       # F13：启动 Mihomo 和可选 TUN 模式
│  │  │  └─ stop.get.ts                        # F13：停止 Mihomo
│  │  └─ music/                                # F10/F11/F12：音乐资源和元数据 API
│  │     ├─ index.get.ts                       # F10：扫描目录并返回音乐列表
│  │     ├─ stream.get.ts                      # F10：提供带 Range 的音频流
│  │     ├─ cover.get.ts                       # F11：读取音乐封面
│  │     ├─ lyrics.get.ts                      # F11/F12：读取内嵌歌词
│  │     ├─ info.get.ts                        # F11：读取并脱敏完整元数据
│  │     ├─ tags.get.ts                        # F11：读取标签编辑表单数据
│  │     ├─ tags.put.ts                        # F11：写入音乐标签和歌词
│  │     └─ tags.delete.ts                     # F11：清除音乐标签
│  └─ utils/                                  # F3/F5/F9/F10/F11/F13/F14/F15：服务端能力
│     ├─ ai-tools/                             # F9：Chat AI 工具
│     │  ├─ index.ts                           # F9：AI 工具注册表
│     │  └─ get-time.ts                         # F9：获取当前日期和时间
│     ├─ apps.ts                               # F3：读取 Windows 应用和 AppID 缓存
│     ├─ commands.ts                           # F5：启动 Windows Terminal 命令
│     ├─ conf.ts                               # F7/F8/F10/F14：Conf schema、默认值和持久化
│     ├─ folders.ts                            # F4：受控文件夹路径注册表
│     ├─ mihomo.ts                             # F13：进程检测、配置合并、提权启停
│     ├─ music.ts                              # F10/F11：音乐目录和文件路径校验
│     └─ open.ts                               # F3/F4/F5：分离进程启动工具
├─ shared/                                    # F3/F7/F8/F10/F14/F15：前后端共享代码
│  ├─ types/                                   # F3/F7/F8/F10/F14：共享类型

│  │  ├─ application.ts                        # F3：Windows 应用数据类型
│  │  ├─ conf.ts                               # F7/F8/F10/F14：配置类型
│  │  ├─ electron.d.ts                         # F1/F6：window.electronAPI 类型
│  │  └─ music.ts                              # F10/F11：音乐列表项类型
│  └─ utils/                                   # F15：共享服务端工具
│     └─ logger.ts                             # F15：Nitro 服务端日志
├─ .agents/                                    # F17：项目 Agent Skill 配置与 Nuxt UI 参考资料
│  └─ skills/
│     └─ nuxt-ui/                              # F17：Nuxt UI 开发技能和参考文档
│        ├─ SKILL.md
│        └─ references/
│           ├─ components.md
│           ├─ guidelines/
│           │  ├─ component-selection.md
│           │  ├─ conventions.md
│           │  ├─ design-system.md
│           │  └─ forms.md
│           ├─ layouts/
│           │  ├─ chat.md
│           │  ├─ dashboard.md
│           │  ├─ docs.md
│           │  ├─ editor.md
│           │  └─ landing.md
│           └─ recipes/
│              ├─ auth.md
│              ├─ data-tables.md
│              ├─ navigation.md
│              └─ overlays.md
├─ .vscode/
│  └─ settings.json                            # F17：Tailwind、ESLint 和编辑器行为配置
├─ public/
│  └─ favicon.ico                              # F1/F17：应用图标和托盘图标
├─ aio.json                                    # F17：Scoop manifest 和发布下载信息
├─ electron-builder.yml                        # F17：Electron Builder 打包配置
├─ eslint.config.js                            # F17：ESLint 配置
├─ nuxt.config.ts                              # F17：Nuxt、模块、端口和 Vite 配置
├─ opencode.json                               # F17：OpenCode MCP 配置
├─ package.json                                # F17：依赖和开发、构建脚本
├─ package-lock.json                            # F17：npm 依赖锁定文件
├─ release.ts                                  # F17：发布脚本
├─ README.md                                   # F17：项目安装说明
├─ skills-lock.json                            # F17：Agent Skill 版本锁定信息
├─ tsconfig.json                               # F17：TypeScript/Nuxt 工程引用
├─ AGENTS.md                                   # F17：项目开发说明和约束
└─ .gitignore                                  # F17：构建产物、依赖、日志和发布目录忽略规则
```

## 约束

- 这是个人项目，数据来源、使用场景和操作流程都是明确且受控的；按现有代码编写者的习惯实现，不要为了假设不存在的场景增加无用代码。
- 优先使用现有技术栈和模块，在现有文件中完成修改；保持实现简单、直接，不为小功能增加额外抽象、通用层或复杂架构。
- 避免过度防御性编程、重复校验、无意义的状态分支和多余的 `try/catch`；只在真实的外部边界或确有必要的错误场景进行处理。
- 代码应当优雅、清晰、可读，优先保证正常流程直观，避免用复杂结构掩盖简单逻辑。
- `app/pages` 是页面路由，`server/api` 是 Nitro API 路由；共享接口和数据结构放在 `shared/types`，避免重复定义。
- Electron 目录中的代码不得依赖 Nuxt 自动导入；需要使用的模块必须显式导入，preload 保持 CommonJS。
- 页面请求优先使用 `selfFetch` 或 `useSelfFetch`；样式使用 Tailwind class 和 Nuxt UI 的 `ui` 属性，不使用 Prettier。
- Markdown 渲染使用 `@comark/nuxt` 自动导入的 `<Markdown>`（流式传入 `isPartStreaming(part)`），不要再用 `@nuxtjs/mdc` 的 `<MDC>`；`@comark/nuxt` 已自动为 `@nuxt/ui` 设置 `ui.prose: true`，无需也不要在 `nuxt.config.ts` 里手动配置 `ui.prose` 或 `ui.mdc`。代码高亮由 `@comark/nuxt/plugins/shiki` 的 `shiki()` 提供，只配置 `material-theme-lighter` 浅色主题，因此不需要任何 shiki 暗色 CSS 变量规则。
- 应用锁定浅色：`nuxt.config.ts` 里 `ui.colorMode: false`，不使用 `dark:` 变体、暗色切换入口和 `useColorMode`；Nuxt UI 会改用返回 `{ forced: true }` 的同名 stub，`@nuxtjs/color-mode` 不注册。
- 修改代码时遵循现有命名、目录职责和数据流，不擅自改变已有 API、配置字段或模块边界。
- 每次修改代码完成后，必须同步更新 `AGENTS.md`：补充或修正受影响的功能说明、目录与功能对应关系以及相关约束，确保文档与代码保持一致。
- 普通代码修改后运行 `npm run lint` 和 `npm run typecheck`；涉及 Electron、原生模块或打包流程时，再验证相关构建或运行行为。
- 不要执行 `npm run release`，除非用户明确要求发布；该脚本会修改 Git 历史并发布 GitHub Release。
- 不将构建产物、缓存、依赖、日志和 `release/` 纳入 Git。
