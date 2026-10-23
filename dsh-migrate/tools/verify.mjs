// 迁移后自检：目录名是否与会话头 cwd 一致、除 header 帧外是否逐字节未变。
// 用法: node verify.mjs --home "C:\\Users\\<你>\\.dsh"
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { readSessionFile } from './frames.mjs'
import { projectKey } from './paths.mjs'

const i = process.argv.indexOf('--home')
if (i < 0) throw new Error('用法: node verify.mjs --home <DSH_HOME>')
const home = process.argv[i + 1]
const sessionsRoot = join(home, 'sessions')

function walkSessions(root) {
  const out = new Map()
  if (!existsSync(root)) return out
  for (const project of readdirSync(root)) {
    const pd = join(root, project)
    if (!statSync(pd).isDirectory()) continue
    for (const sid of readdirSync(pd)) {
      const dir = join(pd, sid)
      if (!statSync(dir).isDirectory()) continue
      const file = readdirSync(dir).find((n) => /\.jsonl(\.zstd)?$/.test(n))
      if (!file) continue
      let id
      try {
        id = readSessionFile(join(dir, file)).header.id
      } catch {
        id = `unreadable/${project}/${sid}`
      }
      out.set(id, { dir, file: join(dir, file), project })
    }
  }
  return out
}

const current = walkSessions(sessionsRoot)
const backups = readdirSync(home).filter((n) => n.startsWith('sessions.bak-')).sort()
const backupDir = backups.length ? join(home, backups.at(-1)) : undefined
const before = backupDir ? walkSessions(backupDir) : new Map()

const problems = []
const changes = []
let checked = 0
for (const [id, cur] of current) {
  const { header, buf, frame1 } = readSessionFile(cur.file)
  const expected = header.cwd === undefined ? '_no-cwd' : projectKey(header.cwd)
  if (cur.project !== expected) problems.push(`${id}: 目录名 ${cur.project} ≠ ${expected}`)
  const old = before.get(id)
  if (old) {
    const oldRead = readSessionFile(old.file)
    if (!buf.subarray(frame1).equals(oldRead.buf.subarray(oldRead.frame1))) {
      problems.push(`${id}: header 之后的帧字节发生变化（疑似损坏）`)
    } else if (oldRead.header.cwd !== header.cwd) {
      changes.push(`${id}: ${oldRead.header.cwd} -> ${header.cwd}`)
    }
  }
  checked++
}
for (const id of before.keys()) if (!current.has(id)) problems.push(`${id}: 迁移后丢失`)

for (const c of changes) console.log('cwd ' + c)
console.log(`\n会话 ${current.size} 个（迁移前 ${before.size || '无备份'} 个），已检查 ${checked} 个`)
if (problems.length) {
  console.log('发现异常：')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exitCode = 1
} else {
  console.log('✓ 目录名 / header cwd / 其余帧字节 全部一致')
}
