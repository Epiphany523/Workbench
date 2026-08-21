# BytePlus ModelArk 视频生成协议 — 技术设计文档

状态：核心链路（创建任务 / 查询任务 / 图片文件上传 / 默认渠道切换 / 按模型的格式限制 / 参考图上传结果本地持久化 / first_frame·first_and_last_frame·文生视频场景）已实现并通过 `npm run build` / `npm run typecheck`。任务列表接口因文档未提供正文，仍为待核实的最佳猜测实现。

## 1. 协议结论

BytePlus ModelArk 的视频生成 API 与代码里已有的 "Seedance"（`apiFormat: "ark"`）实现是**同一套协议**（Volcengine Ark 内容生成任务协议的国际版）。本次改动没有新增一套 provider，而是把现有 ark/Seedance 分支按真实文档修正、增强，并把它设为默认渠道。

- Base URL（已确认）：`https://ark.ap-southeast.bytepluses.com/api/v3`
- 鉴权（已确认）：`Authorization: Bearer <API Key>`，仅支持 API Key 鉴权，在 BytePlus 控制台的 API Key 页面申请长期 Key。
- 创建任务：`POST {baseUrl}/contents/generations/tasks`
- 查询任务：`GET {baseUrl}/contents/generations/tasks/{id}`
- 查询任务列表：`GET {baseUrl}/contents/generations/tasks`（⚠️ 文档正文本次未提供，字段名为推断，见第 6 节）
- 上传文件（获取参考图公网 URL）：`POST {baseUrl}/files`

## 2. 创建视频任务

对应 `src/services/api/video.ts` 中的 `createSeedanceTask` / `buildSeedanceContent`，请求体结构与真实文档完全一致，未做改动：

```json
{
  "model": "seedance-1-5-pro-251215",
  "content": [
    { "type": "text", "text": "..." },
    { "type": "image_url", "image_url": { "url": "https://.../file" }, "role": "reference_image" }
  ],
  "resolution": "720p",
  "ratio": "16:9",
  "duration": 5,
  "generate_audio": true,
  "watermark": false
}
```

### Multimodal reference（omni reference-to-video）场景

文档确认：`content` 数组里放多张 `image_url`（`role: "reference_image"`）/`video_url`（`role: "reference_video"`）/`audio_url`（`role: "reference_audio"`），即可触发 omni reference-to-video。这正是现有 `buildSeedanceContent`（`video.ts:239-253`）已经在做的事——最多 9 张参考图（`SEEDANCE_REFERENCE_LIMITS.images = 9`，`src/lib/seedance-video.ts`），与 Dreamina Seedance 2.0 系列的上限一致（2.5 系列支持到 30 张，本次不放大上限，等确认默认模型版本后再调整）。**不需要新增字段，代码已经支持这个场景。**

文档还明确：first_frame / first_and_last_frame / omni-reference 三种场景互斥，不能混用。

### 2.2 首帧 / 首尾帧图生视频 + 文生视频（本次新增）

**背景**：用户明确要求把 first_frame（单张首帧图生视频）、first_and_last_frame（首尾帧图生视频）补齐为可选场景，同时确认文生视频（不带任何参考图）场景也要支持。

- **文生视频**：不需要任何代码改动——`buildSeedanceContent` 在没有参考图时本来就只发一个 `{ type: "text", text }`，`requestVideoGeneration`/`createSeedanceTask` 全程没有"至少 N 张参考图"这类校验，UI 侧"生成"按钮唯一的禁用条件是 prompt 是否为空（`canvas-node-prompt-panel.tsx`）。**这条路径此前已经能跑通，本次只是确认+记录，不涉及代码修改。**
- **first_frame / first_and_last_frame**：新增一个"参考图场景"选择器（视频设置面板里，仅 Seedance/ark 格式的配置会显示，位置在分辨率上方），三个互斥选项：
  - `reference`（默认，向后兼容旧行为）——所有参考图都发 `role: "reference_image"`（omni-reference，多图参考），和改动前完全一致。
  - `first_frame`——只取参考图数组里的第 1 张，发 `role: "first_frame"`；如果附了不止 1 张，多出来的会被直接丢弃（不会退化成 reference_image 混用，避免违反互斥约束），需要用户自己只挂 1 张参考图。
  - `first_last_frame`——取第 1、2 张分别发 `role: "first_frame"` / `role: "last_frame"`；只挂 1 张时退化为只发 `first_frame`（相当于 first_frame 场景，末帧留空）；0 张时不发任何图片项（等价于文生视频）。
  - 参考视频/参考音频（`reference_video`/`reference_audio`）不受这个选择器影响，三种场景下都照常按原逻辑发送——docs 里的互斥约束只针对图片的三种角色，没有提到会影响视频/音频参考，这点是推断，不是文档原文确认。
  - `first_frame`/`first_last_frame` 场景下，`buildSeedancePromptText` 不再往 prompt 文本里插入"参考图 1/2"这类编号标签（那套标签是给 omni 多图参考消歧用的，first_frame/last_frame 已经靠 `role` 字段原生表达帧语义，重复标注反而可能误导模型）。
- **默认值 = `reference`**，且是新增字段（`AiConfig.videoReferenceMode` / `CanvasNodeMetadata.videoReferenceMode`，均为可选字符串），未设置时按 `"reference"` 处理——**所有已有节点/配置的行为完全不变**，不会因为这次改动而把已有的 1 张或 2 张参考图的 omni-reference 用法悄悄改成 first_frame/first_last_frame。
- **已知限制，明确不在本次范围内解决**：`first_frame`/`first_last_frame` 依赖"参考图数组的第 1/2 项"来判定谁是首帧谁是末帧，而参考图的顺序目前只能通过连线创建顺序或 `@[node:id]` 提及在文本里出现的先后顺序间接决定，画布上没有任何"查看当前参考图顺序/拖拽调整顺序"的 UI（这个限制对 omni-reference 场景本来就存在，first_frame/first_last_frame 只是让顺序第一次变得有生成结果差异意义）。如果用户反馈"分不清哪张是首帧哪张是末帧"，需要另外设计一个参考图预览/排序 UI，不在本次范围内。
- 视频生成的重试路径（`project.tsx` 的 `handleRetryNode`）会重新按当前画布连线收集参考图，不是回放原始生成时的那一份——这个既有行为在 `reference` 场景下影响有限（顺序变化通常不改变"是否算作参考图"这个结论），但在 `first_frame`/`first_last_frame` 场景下，如果用户在重试前调整了连线顺序，重试可能会用一张不同的图当首帧/末帧。这属于既有架构限制，本次不改动重试路径，先记录。

### 已确认但当前未接入 UI/config 的可选参数

`frames`、`output_format`（mp4/mov）、`camera_fixed`、`return_last_frame`、`draft`、`service_tier`、`callback_url`、`execution_expires_after`、`priority`、`safety_identifier`、`omni_reference_task_type`（2.5 专属）。这些字段 API 都支持，但当前请求体没有传，走的是各自的默认值。不在本次改动范围内，需要时再逐个加。

### 2.1 多模型支持 + 按模型的格式限制（本次新增）

**背景**：`resolution` / `duration` 的合法取值范围因模型而异——同一套 UI 选项不能直接套用到所有模型上，否则用户可能选出当前模型根本不支持的组合（比如给 `2.0 fast` 选 `1080p`）。本次把这类限制从"全局一套"改成"按模型查表"。

`ratio` 取值（`16:9`/`4:3`/`1:1`/`3:4`/`9:16`/`21:9`/`adaptive`）在下面三个模型上是一致的，因此没有做按模型区分；BytePlus 文档里 ratio 的差异主要发生在不同的**任务类型**（文生视频 / 图生视频 / omni-reference / 编辑-延长）之间，不是本次要解决的问题，暂不处理。

新增两个模型渠道条目（`src/stores/use-config-store.ts` 的 `"byteplus"` 渠道），并把限制表实现为 `src/lib/seedance-video.ts` 里的 `SEEDANCE_MODEL_SPECS`（按模型名子串匹配，如 `dreamina-seedance-2-0-fast` 命中 "2-0-fast" 分支，`dreamina-seedance-2-0` 命中 "2-0" 分支，两者互斥且判断顺序为"先特化后通用"）：

| 模型 | model 值（渠道内） | resolution 支持 | resolution 默认 | duration 支持 | duration 默认 |
|---|---|---|---|---|---|
| Dreamina Seedance 1.5 pro（当前默认模型） | `seedance-1-5-pro-251215` | 480p / 720p / 1080p | 720p | `[4, 12]` 或 `-1`（智能时长） | 5 |
| Dreamina Seedance 2.0 | `dreamina-seedance-2-0` | 480p / 720p / 1080p / 4k | 720p | `[4, 15]` 或 `-1` | 5 |
| Dreamina Seedance 2.0 fast | `dreamina-seedance-2-0-fast` | 480p / 720p（**不支持 1080p / 4k**） | 720p | `[4, 15]` 或 `-1` | 5 |
| 其它未匹配到的模型（用户自建渠道/接入点） | — | 480p / 720p / 1080p（沿用旧的全局默认，无法确认真实上限时选保守值） | 720p | `[4, 15]` | 5 |

⚠️ **顺带修正的一个既有小问题**：改动前 `normalizeSeedanceDuration` 对所有模型统一按 `[4, 15]` 夹取，但 1.5 pro 文档里的真实上限是 12——如果用户手动把时长拖到 13–15s，之前会静默通过并把超限的值发给 API。本次按模型建表后，1.5 pro 现在会正确夹到 12。

⚠️ **未确认项**：`dreamina-seedance-2-0` / `dreamina-seedance-2-0-fast` 是否是 BytePlus 控制台里可以直接调用的字面 `model` 值，还是需要像 1.5 pro 一样带一个类似 `-251215` 的版本日期后缀——本次文档里没有给出这两个模型的示例 `model` 字符串，先按用户给出的名字落地成占位渠道条目（和 1.5 pro 占位值同样的处理方式），如果账号侧实际的模型 ID 不同，需要在渠道编辑器里改成真实值；改了之后 `SEEDANCE_MODEL_SPECS` 的子串匹配（`2-0-fast`/`2-0`）仍然会命中，不需要跟着改代码。

⚠️ **4K 像素表是推算值**：`seedancePixelLabel` 给 `4k` 分辨率展示的具体像素数（如 `3840x2160`）是按 1080p 表项 ×2 推算出来的（标准 4K UHD = 2× 1080p），不是文档原文表格——这只是 UI 上一个辅助标签，不影响实际发给 API 的 `resolution` 字段（永远是字符串 `"4k"`），但如果之后拿到官方 4K 像素表，应该替换成真实值。

参考数量上限（`SEEDANCE_REFERENCE_LIMITS`：9 图 / 3 视频 / 3 音频）继续沿用不变——文档确认这与 Dreamina Seedance 2.0 系列（含 fast/mini）一致；1.5 pro 的参考数量上限文档未单独给出，暂沿用同一套数字。

## 3. 查询视频任务

对应 `pollSeedanceTask`（`video.ts:200-211`），逻辑无需改动，`baseUrl` 换成 BytePlus 后自动生效。响应体里我们关心的字段：`status`（queued/running/succeeded/failed/cancelled/expired，注意文档里成功状态叫 `succeeded`，没有 `completed`——代码里 `SeedanceTask.status` 类型已经包含 `succeeded`）、`content.video_url`、`content.last_frame_url`、`error.code`/`error.message`。

需要注意的文档细节（当前实现已符合，无需改动）：
- 视频 URL 有效期 24 小时，需及时转存——`storeGeneratedVideo`（`video.ts:125-135`）已经会把结果 `uploadMediaFile` 到本地存储，符合"及时转存"的要求。
- 只能查询过去 7 天内的任务。

## 4. 图片上传（Files API）——本次新增

对应新增函数 `uploadReferenceImageToByteplus`（`video.ts`）。

```
POST {baseUrl}/files
Content-Type: multipart/form-data

file: <binary>
purpose: user_data
```

- `purpose` 字段文档确认取值只有 `user_data` / `agent` 两种，本次固定传 `user_data`（不是 vision，之前的推断是错的，已按文档修正）。
- 响应体里拿访问 URL 用的字段是 **`download_url`**（"A server-presigned file download URL that points to the underlying TOS object"），不是 `url`/`file_url`（之前的推断也已按文档修正）。
- 响应体里的 `status` 可能是 `processing`/`active`/`failed`；本次实现里如果 `status === "failed"` 直接读 `error.message` 抛错，`processing` 状态目前直接把 `download_url` 当结果返回。✅ **已由 Files API 文档原文确认**："Only when status is active can the corresponding file_id be used for multimodal understanding in the Responses API and Chat API"——这条"只有 active 才能用"的限制，文档原文明确限定在 `file_id`（按文件 ID 引用）+ Responses/Chat API（多模态理解）这个组合上，跟视频生成接口（Content Generation Tasks）用 `download_url` 塞进 `image_url.url` 是两条不相关的路径，`file_id` 本身也不能作为 `image_url.url` 的合法取值（视频生成只认真实 URL 或 `asset://<Asset_Id>`）。因此本实现不受这条限制，`processing` 阶段直接用 `download_url` 是安全的，不需要额外轮询 `GET /files/{id}` 等 `active`。

调用点：`resolveSeedanceImageUrl`（`video.ts:255-259`）——本地图片（非公网 URL、非 `asset://`）不再退化成 base64 内联，而是先调用上传接口拿 `download_url`。上传结果按 `image.storageKey` 缓存（`byteplusFileUploadCache`），避免同一张图在一次生成里被多次上传。

**为什么要上传而不是继续用 base64**：文档虽然确认 `image_url.url` 也接受 base64 data URL，但同时明确建议"大文件不要用 Base64 编码"，且请求体总大小上限 64 MB——用户本地参考图可能来自设备拍摄的原图，直接内联容易顶到这个上限。改成先上传拿 URL 是更稳妥的默认路径。

## 5. 面向桌面端的本地磁盘持久化（本次新增）

**背景**：产品后续会打包成桌面端程序。BytePlus 这边有两类"会过期"的远端数据，一旦过期就彻底拿不回来，只能重新生成/重新上传；桌面端场景下会话生命周期更长（用户可能几天才重开一次画布），比纯网页场景更容易撞到过期窗口。原则是：**只要拿到手，就尽快转存到本地磁盘（IndexedDB，通过 `localforage`），而不是一直依赖远端 URL 还没过期**。

| 数据 | 过期窗口（文档确认） | 现状 | 本次改动 |
|---|---|---|---|
| 生成结果视频 `content.video_url` | 24 小时 | 已持久化：`storeGeneratedVideo`（`video.ts:125-135`）在任务 `succeeded` 后立刻把视频 blob 存进 `uploadMediaFile`（`file-storage.ts`，`localforage` `media_files` store） | 无需改动，本节只是重申这个机制已经满足"及时转存"的要求 |
| 参考图上传后的 `download_url`（Files API） | 默认 7 天（可通过请求参数放宽到 1–30 天，本次没有传这个参数，按默认 7 天算） | 改动前：只有一个**内存态** `Map`（`byteplusFileUploadCache`），画布刷新/应用重启就丢，同一张参考图下次生成还会重新上传一遍 | 新增 `src/services/byteplus-file-cache.ts`：用 `localforage`（`byteplus_file_uploads` store）把 `storageKey → {downloadUrl, uploadedAt}` 落盘；读取时检查是否超过 6 天（比 7 天默认值提前一天失效，留安全余量），超过就当缓存未命中，重新走一次上传。内存 `Map` 保留下来，但职责改成"同一批生成里防止并发重复上传"，不再是长期缓存 |

`resolveSeedanceImageUrl` → `uploadReferenceImageToByteplus`（`video.ts`）现在的查找顺序：内存里的进行中请求 → 本地磁盘缓存（未过期）→ 都没有才真正调用 `POST /files`。

⚠️ **明确不在本次范围内**：
- 任务级别的"断点续传"——如果用户在视频任务还在 `queued`/`running` 时关掉应用，目前没有把 `task.id`/`model`/`provider` 落盘，重开后不会自动继续轮询。7 天的任务查询窗口理论上够用（`pollSeedanceTask` 找不到进行中的任务时会直接报错，不会自动重新发起生成），但这属于新的功能面（需要在画布节点上持久化"进行中任务"的状态），不是"把已经拿到的数据存到本地"这类改动，先记录，等用户明确要做"生成历史/断点续传"时再设计。
- Files API 返回体里如果带 `expire_at` 字段（本次拿到的文档片段里没确认这个字段是否存在于响应体），可以直接用它替代"上传时间 + 6 天"这种保守估算；目前没有真实响应样本验证，先用保守估算。

## 6. 查询视频任务列表（⚠️ 待核实）

本次用户提供的文档正文里**没有包含**"查询视频任务列表"（`1521675`）这一篇的具体参数，因此 `listSeedanceTasks`（`video.ts:293-...`）目前的实现是基于 Ark 惯例的推断：

```
GET {baseUrl}/contents/generations/tasks?page_num=1&page_size=10&status=succeeded
```

- 分页参数名（`page_num`/`page_size`）、返回结构（`{items: [...]}` 还是分页包装对象）都未经真实文档或真实请求验证。
- 当前代码库里没有任何"生成历史/任务列表"UI 消费这个函数，属于 service 层的能力补齐，不影响现有功能。
- 如果需要真正用上这个接口（比如做一个"历史任务"面板），建议先贴一下 `1521675` 页面的正文，或者直接用真实 API Key 跑一次 `GET {baseUrl}/contents/generations/tasks` 看实际返回结构，再修正实现。

## 7. 默认渠道切换（`src/stores/use-config-store.ts`）

**本次更新**：应用户要求，`defaultConfig` 现在只保留一个渠道——默认渠道即 BytePlus（`channels[0]`、`id: "default"`、`name` 走 `config.channels.defaultName` 这个 i18n key，渲染成"默认渠道"/"Default Channel"，`baseUrl` 用 BytePlus 的地址），渠道内的模型列表就是本文档涉及的全部三个视频模型（第 2.1 节）；原来第二位的 OpenAI 渠道（图片/文本/语音）已整体移除，`model`/`imageModel`/`textModel`/`audioModel` 这几个默认值也相应清空为 `""`——**默认配置里不再预置任何图片生成/文本/语音模型**，只保留视频能力。顶层的 `defaultConfig.baseUrl`/`apiFormat`（简易模式兜底字段，以及 `resolveModelChannel` 找不到任何匹配渠道时的最终兜底）指向 BytePlus/`"ark"`。

```ts
const BYTEPLUS_BASE_URL = "https://ark.ap-southeast.bytepluses.com/api/v3";
const BYTEPLUS_VIDEO_MODEL_PLACEHOLDER = "seedance-1-5-pro-251215"; // 文档示例模型，需账号已开通
const BYTEPLUS_VIDEO_MODEL_2_0 = "dreamina-seedance-2-0";
const BYTEPLUS_VIDEO_MODEL_2_0_FAST = "dreamina-seedance-2-0-fast";

baseUrl: BYTEPLUS_BASE_URL,
apiFormat: "ark",
channels: [
    {
        id: "default",
        name: i18n.t("config.channels.defaultName"), // "默认渠道" / "Default Channel"
        baseUrl: BYTEPLUS_BASE_URL,
        apiFormat: "ark",
        models: [
            { name: BYTEPLUS_VIDEO_MODEL_PLACEHOLDER, capability: "video" }, // 当前默认模型，见第 2.1 节
            { name: BYTEPLUS_VIDEO_MODEL_2_0, capability: "video" },
            { name: BYTEPLUS_VIDEO_MODEL_2_0_FAST, capability: "video" },
        ],
    },
],
videoModel: "default::seedance-1-5-pro-251215", // 沿用文档表格里标注的"当前默认模型"（第 2.1 节）
model: "",
imageModel: "",
textModel: "",
audioModel: "",
models: ["default::seedance-1-5-pro-251215", "default::dreamina-seedance-2-0", "default::dreamina-seedance-2-0-fast"],
```

**用户如果仍需要图片/文本/语音能力**：默认配置不再预置这些模型，但架构本身没有变化——用户可以在配置弹窗的渠道编辑器里手动新增一个渠道（比如指向 OpenAI），并把对应能力的模型加进去，`imageModel`/`textModel`/`audioModel` 等字段会在下拉框里正常显示新加的模型。这不是代码限制，只是默认预置内容的取舍。

**仍然待用户确认的一项**：这三个模型 ID 都是文档/需求里给出的示例名字，真正能否调用取决于账号是否已激活对应模型（文档"Model activation"一节：账号余额 > 30 美元，或购买了 AI Savings Plan / Seedance 资源包）。如果账号开通的是别的版本（比如自建的 `ep-xxxx` 接入点，或模型 ID 带版本日期后缀），需要在配置弹窗的渠道编辑器里把对应的模型名换成用户自己的——只要新名字里仍然包含 `2-0-fast`/`2-0`/`1-5-pro` 这类子串，第 2.1 节的按模型限制表会继续正确匹配；如果完全不含这些子串（比如换成纯 `ep-xxxx` 接入点 ID），会落到"未匹配到的模型"这一档默认限制上。

⚠️ **兼容性说明**：这个改动只影响`defaultConfig`（全新安装 / 重置配置后的初始值），不会主动迁移已有用户浏览器里已持久化的 `channels`/`videoModel` 等字段——`persist` 中间件的 `merge` 函数只在字段缺失时才回落到 `defaultConfig` 的值，已经存过配置的用户不会被这次改动影响，除非他们清空配置或手动重置渠道。

**本次同步更新**：`defaultBaseUrlForApiFormat("ark")`（渠道编辑器里"新建渠道"选择 Ark 协议时自动填的默认 URL）原来指向国内 Volcengine 域名 `https://ark.cn-beijing.volces.com/api/v3`，现在改成和默认渠道一致的 BytePlus 域名 `https://ark.ap-southeast.bytepluses.com/api/v3`——即：新建任意 Ark 协议渠道，默认 URL 都是 BytePlus 的地址；`openai`/`gemini` 协议的新建渠道默认 URL 不变，仍各自对应 `https://api.openai.com` / `https://generativelanguage.googleapis.com`。原来专用于国内域名的 `ARK_BASE_URL` 常量已删除（不再有任何代码路径引用国内域名，用户如需接入国内 Volcengine Ark，需要在渠道编辑器里手动把 URL 改成 `https://ark.cn-beijing.volces.com/api/v3`）。

## 8. 明确排除的范围（本次不做）

- 不新增参考图顺序预览/拖拽排序 UI——first_frame/first_and_last_frame 场景下"谁是首帧/末帧"仍然按参考图数组顺序（连线顺序或 `@[node:id]` 文本顺序）隐式决定，见第 2.2 节。
- 不接入 `callback_url`（异步回调通知），继续用现有的轮询（`pollVideoGenerationTask`）机制。
- 不对参考视频/参考音频做 Files API 上传改造，只对图片做（用户本次也只提供了图片上传的文档）。
- 不新增"生成历史/任务列表"UI，也不做任务级断点续传（见第 5 节）。
- 不处理 `draft`（草稿模式，仅 Seedance 1.5 pro 支持）、`omni_reference_task_type`（仅 2.5 支持）、`seed`/`camera_fixed`（1.5 pro/1.0 系列支持，2.0 系列不支持）等模型专属高级参数。
- 不改动视频生成的重试路径去"回放"原始参考图集合（见第 2.2 节末尾）。

## 9. 涉及文件

- `web/src/services/api/video.ts`：`resolveSeedanceImageUrl` 改为调用 `uploadReferenceImageToByteplus`；新增 `uploadReferenceImageToByteplus`、`listSeedanceTasks`；`uploadReferenceImageToByteplus` 接入本地磁盘缓存（第 5 节）；`createSeedanceTask` 按当前模型做 `resolution`/`duration` 归一化；`buildSeedanceContent` 按 `config.videoReferenceMode` 给参考图分配 `first_frame`/`last_frame`/`reference_image` 角色（第 2.2 节）。
- `web/src/services/byteplus-file-cache.ts`（新增）：参考图上传 `download_url` 的本地持久化缓存（`localforage`，带 TTL）。
- `web/src/lib/seedance-video.ts`：新增按模型的格式限制表 `SEEDANCE_MODEL_SPECS`/`resolveSeedanceModelSpec`，`normalizeSeedanceResolution`/`normalizeSeedanceDuration`/`seedancePixelLabel` 改为按 `model` 参数查表；`seedanceResolutionOptions`/`seedanceDurationOptions` 改为按模型返回选项的函数；新增 `SEEDANCE_REFERENCE_MODES`/`normalizeSeedanceReferenceMode`/`seedanceImageRoles`（第 2.2 节）；`buildSeedancePromptText` 新增 `mode` 参数，非 `reference` 场景下不再插入参考图编号标签。
- `web/src/components/video-settings-panel.tsx`：Seedance 设置面板改为按当前模型渲染可选的分辨率/时长选项；新增"参考图场景"选择器（第 2.2 节）。
- `web/src/types/canvas.ts`：新增 `CanvasVideoReferenceMode` 类型，`CanvasNodeMetadata.videoReferenceMode` 字段。
- `web/src/stores/use-config-store.ts`：`defaultConfig.channels` 的 BytePlus 渠道新增 `dreamina-seedance-2-0`/`dreamina-seedance-2-0-fast` 两个模型条目；`AiConfig` 新增 `videoReferenceMode` 字段（默认 `"reference"`）；BytePlus 渠道提升为唯一的默认渠道（`id: "default"`），原 OpenAI 渠道（图片/文本/语音）整体移除，`model`/`imageModel`/`textModel`/`audioModel` 默认值清空为 `""`，顶层 `baseUrl`/`apiFormat` 同步指向 BytePlus/`"ark"`（第 7 节）。
- `web/src/lib/canvas/canvas-generation-helpers.ts`、`web/src/components/canvas/canvas-config-node-panel.tsx`、`web/src/components/canvas/canvas-node-prompt-panel.tsx`：三处各自的 `buildGenerationConfig`/`buildNodeConfig` 都补上 `videoReferenceMode` 的节点级/全局配置合并逻辑，和 `vquality`/`videoSeconds` 等字段走的是同一套模式。
- `web/src/i18n/locales/{zh-CN,zh-TW,en-US}.ts`：新增 `apiErrors.byteplusFileUploadFailed`、`apiErrors.seedanceTaskListFailed`；新增 `settingsPanels.video.referenceMode`/`referenceModes`/`referenceModeHints`。

## 10. 验证方式

1. `cd web && npm run typecheck && npm run build`（当前只剩一个与本次改动无关的既有类型错误 `canvas-generation-helpers.ts(51,47)`）。
2. 拿真实 BytePlus API Key 填进"BytePlus"渠道，确认账号已激活对应模型（或换成账号里实际可用的模型/接入点 ID）。
3. 在画布里用一张本地图片作为参考图创建一个视频生成任务，确认：
   - 网络面板里能看到先有一个 `POST /files` 请求，拿到 `download_url` 后再发 `POST /contents/generations/tasks`。
   - 任务创建成功、轮询能查到 `succeeded` 状态并拿到 `video_url`。
   - 故意断网/用错 API Key 验证上传失败时会直接抛错，不会静默退化成 base64。
4. 切换渠道模型到 `dreamina-seedance-2-0-fast`，确认视频设置面板里分辨率选项只剩 480p/720p（1080p/4k 消失），时长输入被限制在 `[4,15]` 或 `-1`；切回 `seedance-1-5-pro-251215`，确认时长上限变回 12（不能再拖到 13–15）。
5. 用同一张参考图连续发起两次生成，打开浏览器 DevTools → Application → IndexedDB → `infinite-canvas` → `byteplus_file_uploads`，确认第二次生成时网络面板里不再有新的 `POST /files` 请求（命中本地缓存），且刷新页面后第三次生成依然命中缓存（验证的是"持久化"而不只是内存缓存）。
6. 不挂任何参考图，直接填 prompt 生成，确认文生视频能正常创建任务并出图（无需切换"参考图场景"，任何场景下 0 张参考图都等价于文生视频）。
7. 视频设置面板里把"参考图场景"切到"图生视频·首帧"，只挂 1 张参考图生成，网络面板里确认 `content` 数组中该图的 `role` 是 `"first_frame"`，不是 `"reference_image"`。
8. 切到"图生视频·首尾帧"，挂 2 张参考图，确认第 1 张 `role: "first_frame"`、第 2 张 `role: "last_frame"`；挂 3 张时确认第 3 张被丢弃、不出现在 `content` 里。
9. 切回默认的"多图参考"，确认挂 1~9 张参考图时仍然都是 `role: "reference_image"`（验证向后兼容，行为和改动前一致）。
