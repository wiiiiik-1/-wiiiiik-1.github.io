// 校验「只改 cwd」的导入：除第一帧外，其余字节必须与原件完全一致。
// 用法: node compare-frames.mjs <原件> <导入后文件>
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { zstdDecompressSync } from 'node:zlib'

const MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])
function offsets(buf) {
  const out = []
  for (let i = buf.indexOf(MAGIC); i !== -1; i = buf.indexOf(MAGIC, i + 1)) out.push(i)
  return out
}
const [srcPath, dstPath] = process.argv.slice(2)
if (!srcPath || !dstPath) throw new Error('用法: node compare-frames.mjs <原件> <导入后文件>')

const a = readFileSync(srcPath)
const b = readFileSync(dstPath)
const oa = offsets(a)
const ob = offsets(b)
const headA = JSON.parse(zstdDecompressSync(a.subarray(oa[0], oa[1] ?? a.length)).toString('utf8').trim())
const headB = JSON.parse(zstdDecompressSync(b.subarray(ob[0], ob[1] ?? b.length)).toString('utf8').trim())

const restA = a.subarray(oa[1] ?? a.length)
const restB = b.subarray(ob[1] ?? b.length)
const sha = (x) => createHash('sha256').update(x).digest('hex')
const same = sha(restA) === sha(restB)

console.log(`id        ${headA.id} -> ${headB.id}  ${headA.id === headB.id ? '✓' : '✗'}`)
console.log(`cwd       ${headA.cwd}`)
console.log(`          -> ${headB.cwd}`)
console.log(`frames    ${oa.length} -> ${ob.length}  ${oa.length === ob.length ? '✓' : '✗'}`)
console.log(`rest      ${restA.length} B sha256=${sha(restA).slice(0, 16)}`)
console.log(`          ${restB.length} B sha256=${sha(restB).slice(0, 16)}`)
console.log(`verdict   ${same && oa.length === ob.length ? '✓ 除首帧外逐字节一致' : '✗ 有差异'}`)
if (headA.id !== headB.id || !same || oa.length !== ob.length) process.exitCode = 1
