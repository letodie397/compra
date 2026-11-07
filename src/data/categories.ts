import type { CategoryId, Unit } from '../types'

const UNIT_NAMES: Record<Unit, [string, string]> = {
  un: ['unidade', 'unidades'],
  pct: ['pacote', 'pacotes'],
  L: ['litro', 'litros'],
  ml: ['ml', 'ml'],
  kg: ['quilo', 'quilos'],
  g: ['grama', 'gramas'],
}

export const CATEGORIES: {
  id: CategoryId
  label: string
  accent: string
}[] = [
  { id: 'limpeza', label: 'Limpeza', accent: '#2f6f5e' },
  { id: 'higiene', label: 'Higiene', accent: '#3d6b8a' },
  { id: 'cozinha', label: 'Cozinha', accent: '#8a5a2b' },
  { id: 'lavanderia', label: 'Lavanderia', accent: '#5a4f8a' },
  { id: 'outros', label: 'Outros', accent: '#4a5c4e' },
]

export const UNITS: Unit[] = ['un', 'pct', 'L', 'ml', 'kg', 'g']

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id
}

export function categoryAccent(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.accent ?? '#4a5c4e'
}

export function unitName(unit: Unit): string {
  return UNIT_NAMES[unit][0]
}

export function unitPhrase(quantity: number, unit: Unit): string {
  const [one, many] = UNIT_NAMES[unit]
  const amount = Number.isInteger(quantity) ? quantity : Number(quantity.toFixed(1))
  return `${amount} ${amount === 1 ? one : many}`
}
