/** Remove acentos e deixa minúsculo — busca amigável para idosos. */
export function foldText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

export function textIncludes(haystack: string, needle: string): boolean {
  const q = foldText(needle).trim()
  if (!q) return true
  return foldText(haystack).includes(q)
}

export function textEquals(a: string, b: string): boolean {
  return foldText(a) === foldText(b)
}
