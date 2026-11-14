import type { CategoryId, Unit } from '../types'

export const CATEGORIES: {
  id: CategoryId
  label: string
  accent: string
}[] = [
  { id: 'limpeza', label: 'Limpeza', accent: '#2f6f5e' },
  { id: 'higiene', label: 'Higiene', accent: '#3d6b8a' },
  { id: 'lavanderia', label: 'Lavanderia', accent: '#5a4f8a' },
  { id: 'cozinha', label: 'Cozinha', accent: '#8a5a2b' },
  { id: 'mercearia', label: 'Mercearia', accent: '#6b5b3a' },
  { id: 'hortifruti', label: 'Hortifruti', accent: '#3f7a3a' },
  { id: 'carnes', label: 'Carnes', accent: '#8a3a3a' },
  { id: 'frios', label: 'Frios', accent: '#4a6b8a' },
  { id: 'bebidas', label: 'Bebidas', accent: '#2f5f8a' },
  { id: 'padaria', label: 'Padaria', accent: '#8a6b2b' },
  { id: 'pets', label: 'Pets', accent: '#6a4f3a' },
  { id: 'outros', label: 'Outros', accent: '#4a5c4e' },
]

export const UNITS: Unit[] = ['un']

/** Converte quilo/litro/pacote antigos para unidade. */
export function normalizeUnit(_unit?: string | null): Unit {
  return 'un'
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id
}

export function categoryAccent(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.accent ?? '#4a5c4e'
}

export function unitName(_unit?: Unit): string {
  return 'unidade'
}

export function unitPhrase(quantity: number, _unit?: Unit): string {
  const amount = Number.isInteger(quantity) ? quantity : Number(quantity.toFixed(1))
  return `${amount} ${amount === 1 ? 'unidade' : 'unidades'}`
}
