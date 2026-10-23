# 把 DSH 从虚拟机搬到宿主机（Windows → Windows）

这套脚本把虚拟机里的 `%USERPROFILE%\.dsh`（全部会话、附件、账号凭据、插件配置）和每个工作区文件夹打包，
在宿主机上还原，并把 .dsh 里所有写死的绝对路径改到新位置。

已在真实数据副本上验证：7 个会话、4 个工作区，改写后「会话目录名 / 会话头 cwd / 其余 zstd 帧字节」三项自检全部通过。

---

## 0. 先搞清楚要搬什么

| 位置 | 内容 | 大小 | 是否必须 |
|---|---|---|---|
| `%USERPROFILE%\.dsh\sessions\` | 每个工作区一个目录，里面是 `session.v4.jsonl.zstd` | 3.9 MB | ✅ 会话本体 |
| `%USERPROFILE%\.dsh\storages\workspace.json` | 工作区注册表（**绝对路径**） | 2 KB | ✅ |
| `%USERPROFILE%\.dsh\storages\session_projcache\` | 会话投影缓存（也存了 cwd，可丢） | 小 | ⛔ 会重建 |
| `%USERPROFILE%\.dsh\attachments\` | 会话附件，内容寻址（按 hash 存），与路径无关 | 14 MB | ✅ |
| `%USERPROFILE%\.dsh\.credentials.yaml` | 账号凭据 + API Key 引用 | 1 KB | 可选 |
| `%USERPROFILE%\.dsh\profiles\desktop\` | 插件与模型配置（`cordis.patch.yml` 里有你的 baseURL/模型），`node_modules` 里含绝对路径 | 0.2 MB | ✅ 配置 / ⛔ node_modules |
| `%USERPROFILE%\.dsh\git-forge\` | git 账号与**按工作区绝对路径**的项目授权 | 2 KB | 可选 |
| `%USERPROFILE%\.dsh\llm-deepseek\` | 模型文件清单 | 24 KB | 可选 |
| `%USERPROFILE%\.dsh\dsh-runtimes\` | 下载的 Node/pnpm 运行时 | 257 MB | ⛔ 平台相同可留，否则删掉重下 |
| `%USERPROFILE%\.dsh\cache\` | 缓存 | 5 MB | ⛔ |
| 工作区文件夹本身 | `Desktop\lecturn`、`Desktop\Python` 等 | 你的代码 | ✅ |

另外还有 Electron 的窗口状态（`%APPDATA%\@deepseek-ai\dsh-desktop`，15 MB），**不用搬**，宿主机首次启动会自己生成。

### 为什么路径这么要命

1. `workspace.json` 里存的是 `C:\Users\Latus\Desktop\lecturn` 这种绝对路径；
2. 会话目录名由该路径编码而来（规则：分隔符和 `:` 变 `-`，其它不安全字符转 `~XXXX`），例如
   `C:\Users\Latus\Desktop\Penetration Test` → `--C-Users-Latus-Desktop-Penetration~0020Test--`；
3. 每个会话第一行（header，单独一个 zstd 帧）里还有 `"cwd": "C:\\Users\\Latus\\..."`；
4. DSH 读取会话时会校验 `文件路径 == 由 header.cwd + id 推出的路径`，不一致直接报
   `corrupt session log ... header id and cwd identify ...`。

所以「只拷文件不改路径」还能用，仅当宿主机上旧路径仍然存在（见方案 A）；否则必须三样一起改（方案 B，脚本已做）。

---

## 方案 A：让旧路径在宿主机上「仍然存在」（零改写，最稳）

宿主机用户名/盘符不同，但可以造一个目录联接（junction），让 `C:\Users\Latus\Desktop\lecturn` 指向真实的新位置。
DSH 看到的是老路径，一切原样可用，**一个字节都不用改**。

```powershell
# 管理员 PowerShell；前提：宿主机上没有同名账户的 C:\Users\Latus 目录
mkdir C:\Users\Latus
cmd /c mklink /J "C:\Users\Latus\Desktop\lecturn"           "D:\work\lecturn"
cmd /c mklink /J "C:\Users\Latus\Desktop\Python"            "D:\work\Python"
cmd /c mklink /J "C:\Users\Latus\Desktop\Penetration Test"  "D:\work\Penetration Test"
cmd /c mklink /J "C:\Users\Latus\Documents\deepseek-harness\default-workspace" "D:\work\default-workspace"
```

然后把 `.dsh` 整个拷到宿主机的 `%USERPROFILE%\.dsh` 即可（`pack.ps1` 仍可用来打包，只是 `restore.ps1` 加 `-SkipWorkspaces`）。

- 优点：零风险、可回滚，git-forge 授权等按路径做的配置也全部有效。
- 缺点：路径看起来还是旧的；需要管理员权限；以后想换真实路径还得再做一次方案 B。

> 如果宿主机用户名刚好也是 `Latus` 且盘符也是 `C:`，那什么都不用改，直接拷 `.dsh` + 工作区即可。

---

## 方案 B：改成真实的新路径（本目录脚本，推荐追求「干净」时用）

```powershell
# ① 虚拟机里（会先关掉 DSH，请先结束手头的会话）
.\pack.ps1 -Destination E:\dsh-backup            # 加 -IncludeRuntimes 连同 257MB 运行时一起打包

# ② 把 E:\dsh-backup（或 zip）拷到宿主机

# ③ 宿主机上装好同版本 DeepSeek Harness（见下文「版本」），先不要启动

# ④ 宿主机上还原 + 改路径
.\restore.ps1 -Source E:\dsh-backup -Map "C:\Users\Latus=>D:\Latus"
```

`-Map` 可以给多条，最长前缀优先，例如：

```powershell
.\restore.ps1 -Source E:\dsh-backup `
  -Map "C:\Users\Latus\Desktop\lecturn=>D:\work\lecturn" `
  -Map "C:\Users\Latus=>D:\home\Latus"
```

`restore.ps1` 依次做：

1. 检查 DSH 没在运行；`-DshHome` 已存在且非空时要求 `-Force`（会挪到 `.before-restore-时间戳` 而不是删除）；
2. `robocopy` 还原 `.dsh`；
3. 跑 `tools/remap.mjs`：重写 `workspace.json`、把会话目录改名成新路径对应的编码、**只替换 header 帧**改写 `"cwd"`、更新 `git-forge\grants.json`、把 `session_projcache` 挪开等自动重建；
4. 跑 `tools/verify.mjs` 自检：目录名与 cwd 是否自洽、除 header 外其余帧是否逐字节未变、会话有无丢失；
5. 按 `manifest.json` 把工作区复制到映射后的新路径。

所有被改动的东西都留了备份：`sessions.bak-<时间戳>`、`workspace.json.bak-<时间戳>`、`grants.json.bak-<时间戳>`。

只想看会改什么、不动文件：

```powershell
node .\tools\remap.mjs --home "$env:USERPROFILE\.dsh" --map "C:\Users\Latus=>D:\Latus" --dry-run
```

---

## 方案 C：只要存档，不要求会话能续聊

```powershell
.\pack.ps1 -Destination E:\dsh-backup
```

拿到备份后哪天真要看，再按方案 A/B 还原。适合「先搬家，旧会话当资料」的场景。

---

## 搬家时必须注意的几件事

- **版本**：虚拟机里是 `0.2.1-rc.2`（nightly 通道，win-x64）。宿主机装同版本最省心；装更新版本也行（会话格式只会向前迁移）；**不要装更旧的版本**。
- **凭据**：`.credentials.yaml` 里的 `deepseek-account-platform/device` 是设备授权，换机器后大概率要重新登录一次。API Key 引用（`DS_API_KEY`）会保留。
- **插件依赖**：`profiles\desktop\node_modules` 里 pnpm 的 `.modules.yaml`/`.pnpm-workspace-state-v1.json` 写着旧绝对路径。脚本没改它们，最稳的做法是还原后删掉该目录，让 DSH 重新安装插件依赖（你只装了 `dsh-git-forge`，重装很快）。
- **运行时**：`dsh-runtimes` 是 257 MB 的 Node/pnpm，平台相同（win-x64）可以整包带走；不带的话首次启动会联网重下。
- **传输**：VMware 共享文件夹直接拷大文件容易卡，建议先在虚拟机里打包成 zip 再拷。
- **工作区路径别用 OneDrive 同步目录**：`.dsh` 里有活跃写入的 jsonl 和锁文件，云同步会打架。
- **首次启动后自查**：工作区列表齐全、打开旧会话能看到历史、能正常发一条消息（说明 cwd 和沙箱都正常）、git-forge 项目授权还在。Windows 沙箱若对新路径报 ACL 拒绝，用 `diagnose-windows-sandbox-acl` 技能修一次即可。

## 目录结构

```
dsh-migrate\
  pack.ps1              虚拟机侧打包（.dsh + 全部工作区 + manifest.json）
  restore.ps1           宿主机侧还原 + 改路径 + 自检
  tools\paths.mjs       路径编码规则（与 DSH 源码一致）
  tools\frames.mjs      zstd 多帧读取 / 只替换 header 帧
  tools\remap.mjs       路径改写主逻辑（支持 --dry-run）
  tools\verify.mjs      改写后自检
  tools\map-path.mjs    restore.ps1 复用的单路径映射
```

## 回滚

方案 B 出问题时：

```powershell
Remove-Item "$env:USERPROFILE\.dsh" -Recurse -Force
Rename-Item "$env:USERPROFILE\.dsh.before-restore-<时间戳>" ".dsh"
```

或从 `sessions.bak-*` 恢复会话目录、从 `workspace.json.bak-*` 恢复注册表，再把工作区文件搬回旧路径。
