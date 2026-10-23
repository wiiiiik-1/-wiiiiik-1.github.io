// 探查会话记录的类型分布与字段形状（只读，不改文件）
import { readFileSync } from 'node:fs'
import { zstdDecompressSync } from 'node:zlib'

const MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])

function decodeAll(buf) {
  const offs = []
  for (let i = buf.indexOf(MAGIC); i !== -1; i = buf.indexOf(MAGIC, i + 1)) offs.push(i)
  const parts = []
  for (const off of offs) {
    try { parts.push(zstdDecompressSync(buf.subarray(off))) } catch { /* skip bad tail */ }
  }
  return Buffer.concat(parts).toString('utf8')
}

const file = process.argv[2]
if (!file) throw new Error('用法: node probe.mjs <session.v4.jsonl.zstd>')
const text = decodeAll(readFileSync(file))
const recs = text.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l))

const counts = new Map()
const sample = new Map()
for (const r of recs) {
  counts.set(r.type, (counts.get(r.type) ?? 0) + 1)
  if (!sample.has(r.type)) sample.set(r.type, r)
}
console.log(`records=${recs.length}`)
for (const [t, n] of [...counts].sort((a, b) => b[1] - a[1])) {
  const keys = Object.keys(sample.get(t)).join(',')
  console.log(`  ${String(n).padStart(5)}  ${t.padEnd(24)} keys: ${keys}`)
}
