// 单路径映射工具：给 restore.ps1 复用同一套 old=>new 规则。
// 用法: node map-path.mjs --map "C:\Users\Latus=>D:\Latus" --path "C:\Users\Latus\Desktop\lecturn"
// 命中时打印新路径；未命中时打印空行并以退出码 2 结束。
import { makeMapper } from './paths.mjs'

const argv = process.argv.slice(2)
const maps = []
let target
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--map') maps.push(argv[++i])
  else if (argv[i] === '--path') target = argv[++i]
}
if (!maps.length || target === undefined) throw new Error('用法: node map-path.mjs --map "old=>new" [--map ...] --path <path>')
const mapped = makeMapper(maps)(target)
if (mapped === undefined) {
  console.log('')
  process.exit(2)
}
console.log(mapped)
