// 把 DSH 会话（多帧 zstd）抽成可读摘要：用户消息 + 助手正文 + 工具调用一行。
// 不打印 reasoning，不打印工具结果正文；用于快速了解历史会话做了什么。
// 用法: node digest.mjs <session.v4.jsonl.zstd> [out.md]
import { readFileSync, writeFileSync } from 'node:fs'
import { zstdDecompressSync } from 'node:zlib'

const MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])

function decodeAll(buf) {
  const offs = []
  for (let i = buf.indexOf(MAGIC); i !== -1; i = buf.indexOf(MAGIC, i + 1)) offs.push(i)
  const parts = []
  let bad = 0
  for (const off of offs) {
    try { parts.push(zstdDecompressSync(buf.subarray(off))) } catch { bad++ }
  }
  return { text: Buffer.concat(parts).toString('utf8'), frames: offs.length, bad }
}

const clip = (s, n) => (typeof s === 'string' && s.length > n ? s.slice(0, n) + ` …[+${s.length - n}字]` : s ?? '')
const oneLine = (s, n) => clip(String(s).replace(/\s+/g, ' ').trim(), n)

/** 工具调用的一行摘要：取最具辨识度的入参 */
function callSummary(name, argsText) {
  let a = {}
  try { a = JSON.parse(argsText) } catch { return oneLine(argsText, 160) }
  const pick = a.description ?? a.file_path ?? a.path ?? a.pattern ?? a.command ?? a.queries ?? a.prompt ?? a.url
  const extra = []
  if (a.command && pick !== a.command) extra.push(oneLine(a.command, 160))
  if (a.queries) extra.push(JSON.stringify(a.queries))
  if (a.offset) extra.push(`offset=${a.offset}`)
  const body = pick === undefined ? oneLine(argsText, 160) : oneLine(pick, 200)
  return extra.length ? `${body} | ${extra.join(' | ')}` : body
}

const [file, out] = process.argv.slice(2)
if (!file) throw new Error('用法: node digest.mjs <session.v4.jsonl.zstd> [out.md]')

const { text, frames, bad } = decodeAll(readFileSync(file))
const recs = text.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l))
const header = recs[0]
const title = [...recs].reverse().find((r) => r.type === 'session/title')?.data?.title ?? '(无)'

const L = []
L.push(`# ${title}`)
L.push('')
L.push(`- id: \`${header.id}\``)
L.push(`- cwd: \`${header.cwd}\``)
L.push(`- 创建: ${new Date(header.createdAt).toISOString()}`)
L.push(`- 规模: ${frames} 帧 / ${recs.length} 条记录${bad ? `（坏帧 ${bad}）` : ''}`)
L.push('')

let lastTurn = 0
let lastStep = 0
let pendingCalls = []

const flushCalls = () => {
  if (!pendingCalls.length) return
  for (const c of pendingCalls) L.push(`  - \`${c.name}\` — ${c.summary}`)
  pendingCalls = []
}

for (const r of recs) {
  if (r.type === 'turn/start') {
    flushCalls()
    const t = r.data?.turn ?? r.data?.index ?? (lastTurn + 1)
    lastTurn = t
    L.push('', `## 第 ${t} 轮`, '')
    continue
  }
  if (r.type === 'user/message') {
    flushCalls()
    const txt = (r.data?.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('\n')
    if (/^Current runtime context\./.test(txt.trim())) continue // 每轮的运行时上下文注入，跳过
    L.push(`**用户** (\`seq ${r.seq}\`):`, '', '```text', clip(txt.trim(), 3000), '```', '')
    continue
  }
  if (r.type === 'assistant/message') {
    const content = r.data?.message?.content ?? []
    const step = r.data?.step
    const texts = content.filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim()
    const calls = content.filter((c) => c.type === 'tool-call')
    for (const c of calls) pendingCalls.push({ name: c.name, summary: callSummary(c.name, c.arguments) })
    if (texts) {
      flushCalls()
      if (step !== lastStep) { L.push(`_步骤 ${step}_`, ''), (lastStep = step) }
      L.push(`**助手**:`, '', clip(texts, 1500), '')
    }
    continue
  }
  if (r.type === 'workspace/changes') {
    flushCalls()
    const d = r.data ?? {}
    const entries = d.changes ?? d.files ?? d.entries ?? d
    const list = Array.isArray(entries) ? entries.map((e) => (typeof e === 'string' ? e : e.path ?? JSON.stringify(e))).slice(0, 40) : []
    L.push(`_工作区变更_${list.length ? ': ' + list.join(', ') : ': ' + oneLine(JSON.stringify(d), 300)}`, '')
    continue
  }
}
flushCalls()

const md = L.join('\n')
if (out) {
  writeFileSync(out, md, 'utf8')
  console.error(`wrote ${md.length} chars -> ${out}`)
} else {
  process.stdout.write(md)
}
