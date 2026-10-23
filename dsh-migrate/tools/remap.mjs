// 把 .dsh 里所有“绝对路径”从旧根目录改到新根目录（会话目录名、会话头 cwd、workspace.json、git-forge 授权）。
// 用法:
//   node remap.mjs --home "C:\\Users\\<你>\\.dsh" --map "C:\\Users\\Latus=>D:\\Latus" [--dry-run]
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync, copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { readSessionFile, replaceHeader } from './frames.mjs'
import { projectKey, encodeSegment, makeMapper } from './paths.mjs'

const argv = process.argv.slice(2)
const opts = { home: undefined, maps: [], dryRun: false }
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--home') opts.home = argv[++i]
  else if (a === '--map') opts.maps.push(argv[++i])
  else if (a === '--dry-run') opts.dryRun = true
  else throw new Error(`未知参数: ${a}`)
}
if (!opts.home) throw new Error('缺少 --home')
if (opts.maps.length === 0) throw new Error('缺少 --map "旧根=>新根"')

const mapPath = makeMapper(opts.maps)
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const log = (...a) => console.log(...a)

const sessionsRoot = join(opts.home, 'sessions')
const workspaceFile = join(opts.home, 'storages', 'workspace.json')
const grantsFile = join(opts.home, 'git-forge', 'grants.json')
const projcache = join(opts.home, 'storages', 'session_projcache')

const isSessionLog = (name) => /\.jsonl(\.zstd)?$/.test(name)

/** 读 JSON 并容忍 BOM（Windows 上手工编辑过的文件常见）。 */
function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
}

function plan() {
  const items = []
  if (!existsSync(sessionsRoot)) return items
  for (const project of readdirSync(sessionsRoot)) {
    const projectDir = join(sessionsRoot, project)
    if (!statSync(projectDir).isDirectory()) continue
    for (const sid of readdirSync(projectDir)) {
      const dir = join(projectDir, sid)
      if (!statSync(dir).isDirectory()) continue
      const files = readdirSync(dir).filter(isSessionLog)
      if (files.length === 0) continue
      const { header } = readSessionFile(join(dir, files[0]))
      items.push({ dir, id: header.id, cwd: header.cwd, next: header.cwd === undefined ? undefined : mapPath(header.cwd) })
    }
  }
  return items
}

const items = plan()
const unmapped = items.filter((i) => i.cwd !== undefined && i.next === undefined)
if (unmapped.length) {
  log('⚠ 以下会话的 cwd 没有命中任何 --map，将原样保留：')
  for (const u of unmapped) log(`  ${u.id}  ${u.cwd}`)
}

const staging = join(opts.home, `sessions.__new__${stamp}`)
let rebuilt = 0
for (const item of items) {
  const { dir, id, cwd, next } = item
  const targetCwd = next ?? cwd
  const targetDir = join(staging, targetCwd === undefined ? '_no-cwd' : projectKey(targetCwd), encodeSegment(id))
  if (opts.dryRun) {
    log(`${cwd ?? '(no cwd)'}  ->  ${targetCwd ?? '(no cwd)'}`)
    log(`  ${dir}`)
    log(`  => ${targetDir}`)
    rebuilt++
    continue
  }
  mkdirSync(targetDir, { recursive: true })
  for (const f of readdirSync(dir)) {
    const src = join(dir, f)
    if (!statSync(src).isFile()) continue
    if (isSessionLog(f) && next !== undefined) {
      const { buf, header } = readSessionFile(src)
      if (header.cwd !== targetCwd) header.cwd = targetCwd
      writeFileSync(join(targetDir, f), replaceHeader(buf, JSON.stringify(header) + '\n'))
    } else {
      copyFileSync(src, join(targetDir, f))
    }
  }
  rebuilt++
}

if (opts.dryRun) {
  log(`\ndry-run：将重建 ${rebuilt} 个会话目录（未写入任何文件）`)
  process.exit(0)
}

if (rebuilt > 0) {
  const backup = join(opts.home, `sessions.bak-${stamp}`)
  if (existsSync(sessionsRoot)) renameSync(sessionsRoot, backup)
  renameSync(staging, sessionsRoot)
  log(`会话目录已重建：${rebuilt} 个；旧目录备份在 ${backup}`)
}

if (existsSync(workspaceFile)) {
  const ws = JSON.parse(readFileSync(workspaceFile, 'utf8'))
  let changed = 0
  for (const w of Object.values(ws.tables?.workspaces ?? {})) {
    const next = mapPath(w.path)
    if (next && next !== w.path) {
      log(`workspace: ${w.path} -> ${next}`)
      w.path = next
      changed++
    }
  }
  if (changed) {
    copyFileSync(workspaceFile, `${workspaceFile}.bak-${stamp}`)
    writeFileSync(workspaceFile, JSON.stringify(ws, null, 2) + '\n')
    log(`workspace.json 已更新 ${changed} 条`)
  }
}

if (existsSync(grantsFile)) {
  const g = JSON.parse(readFileSync(grantsFile, 'utf8'))
  const nextProjects = {}
  let changed = 0
  for (const [k, v] of Object.entries(g.projects ?? {})) {
    const next = mapPath(k) ?? k
    if (next !== k) changed++
    nextProjects[next] = v
  }
  if (changed) {
    copyFileSync(grantsFile, `${grantsFile}.bak-${stamp}`)
    g.projects = nextProjects
    writeFileSync(grantsFile, JSON.stringify(g, null, 4) + '\n')
    log(`git-forge/grants.json 已更新 ${changed} 条`)
  }
}

if (existsSync(projcache)) {
  renameSync(projcache, `${projcache}.bak-${stamp}`)
  log(`已移开会话投影缓存（会自动重建）: ${projcache}.bak-${stamp}`)
}
