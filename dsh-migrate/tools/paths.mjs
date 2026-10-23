// 与 @deepseek-ai/dsh-session-persistence-jsonl 完全一致的目录名 / 段编码规则。
// 会话目录名由“会话头里的 cwd”推出，因此路径迁移必须让两者同时改变。

/** 例: C:\Users\Latus\Desktop\Penetration Test -> --C-Users-Latus-Desktop-Penetration~0020Test-- */
export function projectKey(cwd) {
  if (cwd.length === 0) throw new Error('cannot encode an empty project path')
  let readable = ''
  let separatorRun = false
  for (let i = 0; i < cwd.length; i++) {
    const code = cwd.charCodeAt(i)
    const ch = String.fromCharCode(code)
    if (ch === '/' || ch === '\\' || ch === ':') {
      if (!separatorRun) readable += '-'
      separatorRun = true
    } else if (ch !== '~' && /^[A-Za-z0-9._-]$/.test(ch)) {
      readable += ch
      separatorRun = false
    } else {
      readable += '~' + code.toString(16).toUpperCase().padStart(4, '0')
      separatorRun = false
    }
  }
  return `--${(readable.replace(/^-+/, '') || 'root').slice(0, 251)}--`
}

/** 会话 id 的单段编码（只允许 [A-Za-z0-9._-]，其余转 ~XXXX）。 */
export function encodeSegment(raw) {
  if (raw.length === 0) throw new Error('cannot encode an empty path segment')
  if (raw === '.') return '~002E'
  if (raw === '..') return '~002E~002E'
  let out = ''
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i)
    const ch = String.fromCharCode(code)
    if (ch !== '~' && /^[A-Za-z0-9._-]$/.test(ch)) out += ch
    else out += '~' + code.toString(16).toUpperCase().padStart(4, '0')
  }
  return out
}

/** 把 "old=>new" 列表编译成最长前缀优先的替换函数（Windows 下大小写不敏感）。 */
export function makeMapper(pairs) {
  const maps = pairs
    .map((s) => {
      const idx = s.indexOf('=>')
      if (idx < 0) throw new Error(`--map 需要 old=>new 形式: ${s}`)
      const clean = (p) => p.trim().replace(/\//g, '\\').replace(/\\+$/, '')
      return { old: clean(s.slice(0, idx)), next: clean(s.slice(idx + 2)) }
    })
    .sort((a, b) => b.old.length - a.old.length)
  return (p) => {
    const norm = p.replace(/\//g, '\\').replace(/\\+$/, '')
    const n = norm.toLowerCase()
    for (const m of maps) {
      const o = m.old.toLowerCase()
      if (n === o) return m.next
      if (n.startsWith(o + '\\')) return m.next + norm.slice(m.old.length)
    }
    return undefined
  }
}
