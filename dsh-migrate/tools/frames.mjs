// .dsh 会话日志是“多帧 zstd 拼接”：第 1 帧是 header 行，之后每次 append 一帧。
// Node 的 zstd 解压只会解第一帧，所以这里提供按帧遍历的工具。
import { readFileSync } from 'node:fs'
import { zstdCompressSync, zstdDecompressSync } from 'node:zlib'

const MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])

/** 所有可能是帧起点的偏移（zstd magic 位置）。 */
function magicPositions(buf) {
  const out = []
  for (let i = buf.indexOf(MAGIC); i !== -1; i = buf.indexOf(MAGIC, i + 1)) out.push(i)
  return out
}

/** 第 1 帧的字节长度（用“解出的内容长度不变”来确认边界）。 */
export function firstFrameLength(buf) {
  const expected = zstdDecompressSync(buf).length
  for (const p of magicPositions(buf)) {
    if (p <= 0) continue
    try {
      if (zstdDecompressSync(buf.subarray(0, p)).length === expected) return p
    } catch {
      /* 截断在帧中间，忽略 */
    }
  }
  return buf.length
}

/** 解出第 1 帧（header 行）的文本。 */
export function decodeHeader(buf) {
  return zstdDecompressSync(buf.subarray(0, firstFrameLength(buf))).toString('utf8')
}

/** 用新的 header 行替换第 1 帧，其余帧的字节原样保留。 */
export function replaceHeader(buf, newHeaderText) {
  const len = firstFrameLength(buf)
  const rest = buf.subarray(len)
  if (rest.length > 0 && rest.indexOf(MAGIC) !== 0) {
    throw new Error(`第 1 帧边界异常（offset ${len} 处不是 zstd 帧头），已中止以免损坏会话`)
  }
  return Buffer.concat([zstdCompressSync(Buffer.from(newHeaderText, 'utf8')), rest])
}

export function readSessionFile(path) {
  const buf = readFileSync(path)
  const header = JSON.parse(decodeHeader(buf).split('\n')[0])
  return { buf, header, frame1: firstFrameLength(buf) }
}
