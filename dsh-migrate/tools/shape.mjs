// 打印某类记录里 data 的字段形状（截断，用于写摘要器）
import { readFileSync } from 'node:fs'
import { zstdDecompressSync } from 'node:zlib'

const MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])
function decodeAll(buf) {
  const offs = []
  for (let i = buf.indexOf(MAGIC); i !== -1; i = buf.indexOf(MAGIC, i + 1)) offs.push(i)
  const parts = []
  for (const off of offs) { try { parts.push(zstdDecompressSync(buf.subarray(off))) } catch {} }
  return Buffer.concat(parts).toString('utf8')
}
const clip = (s, n = 700) => (s.length > n ? s.slice(0, n) + '…' : s)

const [file, wanted] = process.argv.slice(2)
const recs = decodeAll(readFileSync(file)).split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l))
for (const t of wanted.split(',')) {
  const hits = recs.filter((r) => r.type === t)
  console.log(`\n########## ${t}  (${hits.length} 条，打印前 ${Math.min(2, hits.length)} 条) ##########`)
  for (const r of hits.slice(0, 2)) console.log(clip(JSON.stringify(r, null, 1)))
}
