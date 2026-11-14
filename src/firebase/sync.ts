import {
  get,
  goOffline,
  goOnline,
  onValue,
  ref,
  set,
  type Unsubscribe,
} from 'firebase/database'
import { SEED_PRODUCTS } from '../data/seed'
import type { Product, ShoppingItem, ShoppingList } from '../types'
import { normalizeUnit } from '../data/categories'
import { COMPRA_ROOT, database } from './config'

export interface CompraRemoteState {
  products: Product[]
  lists: ShoppingList[]
  activeListId: string | null
  updatedAt?: string
}

function uid(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

function createSeedProducts(): Product[] {
  return SEED_PRODUCTS.map((p) => ({
    ...p,
    id: uid(),
    updatedAt: now(),
  }))
}

function asArray<T>(value: unknown): T[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean) as T[]
  if (typeof value === 'object') return Object.values(value) as T[]
  return []
}

function normalizeList(raw: unknown): ShoppingList | null {
  if (!raw || typeof raw !== 'object') return null
  const list = raw as Partial<ShoppingList> & {
    items?: Record<string, ShoppingItem> | ShoppingItem[] | null
  }
  if (!list.id || !list.name) return null

  return {
    id: list.id,
    name: list.name,
    createdAt: list.createdAt ?? now(),
    updatedAt: list.updatedAt ?? now(),
    items: asArray<ShoppingItem>(list.items).map((item) => {
      const normalized: ShoppingItem = {
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: Number(item.quantity) || 1,
        unit: normalizeUnit(item.unit),
        checked: Boolean(item.checked),
      }
      if (item.productId) normalized.productId = item.productId
      if (item.notes) normalized.notes = item.notes
      return normalized
    }),
  }
}

function normalizeProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== 'object') return null
  const product = raw as Partial<Product>
  if (!product.id || !product.name) return null

  const productNormalized: Product = {
    id: product.id,
    name: product.name,
    category: product.category ?? 'outros',
    quantity: Number(product.quantity) || 0,
    minQuantity: Number(product.minQuantity) || 0,
    unit: normalizeUnit(product.unit),
    updatedAt: product.updatedAt ?? now(),
  }

  if (typeof product.notes === 'string' && product.notes.trim()) {
    productNormalized.notes = product.notes
  }

  return productNormalized
}

/** Firebase RTDB rejeita `undefined` em qualquer nível do JSON. */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (entry === undefined) continue
      out[key] = stripUndefined(entry)
    }
    return out as T
  }
  return value
}

export function normalizeState(raw: unknown): CompraRemoteState {
  if (!raw || typeof raw !== 'object') {
    return { products: [], lists: [], activeListId: null }
  }

  const data = raw as {
    products?: unknown
    lists?: unknown
    activeListId?: string | null
    updatedAt?: string
  }

  return {
    products: asArray<unknown>(data.products)
      .map(normalizeProduct)
      .filter((p): p is Product => p !== null),
    lists: asArray<unknown>(data.lists)
      .map(normalizeList)
      .filter((l): l is ShoppingList => l !== null),
    activeListId: data.activeListId ?? null,
    updatedAt: data.updatedAt,
  }
}

export function toRemotePayload(state: CompraRemoteState) {
  const lists: Record<
    string,
    Omit<ShoppingList, 'items'> & { items: Record<string, ShoppingItem> }
  > = {}

  for (const list of state.lists) {
    const items: Record<string, ShoppingItem> = {}
    for (const item of list.items ?? []) {
      const normalizedItem: ShoppingItem = {
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: normalizeUnit(item.unit),
        checked: Boolean(item.checked),
      }
      if (item.productId) normalizedItem.productId = item.productId
      if (item.notes) normalizedItem.notes = item.notes
      items[item.id] = normalizedItem
    }
    lists[list.id] = {
      id: list.id,
      name: list.name,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      items,
    }
  }

  const cleanProducts: Record<string, Product> = {}
  for (const product of state.products) {
    const clean: Product = {
      id: product.id,
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      minQuantity: product.minQuantity,
      unit: normalizeUnit(product.unit),
      updatedAt: product.updatedAt,
    }
    if (product.notes) clean.notes = product.notes
    cleanProducts[product.id] = clean
  }

  return stripUndefined({
    products: cleanProducts,
    lists,
    activeListId: state.activeListId,
    updatedAt: now(),
  })
}

/** Hash estável sem updatedAt — evita rewrite idêntico no Firebase. */
export function stateHash(state: CompraRemoteState): string {
  return JSON.stringify({
    products: state.products
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        quantity: p.quantity,
        minQuantity: p.minQuantity,
        unit: p.unit,
        notes: p.notes ?? '',
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    lists: state.lists
      .map((l) => ({
        id: l.id,
        name: l.name,
        items: (l.items ?? [])
          .map((i) => ({
            id: i.id,
            productId: i.productId ?? '',
            name: i.name,
            category: i.category,
            quantity: i.quantity,
            unit: i.unit,
            checked: i.checked,
            notes: i.notes ?? '',
          }))
          .sort((a, b) => a.id.localeCompare(b.id)),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    activeListId: state.activeListId,
  })
}

export async function fetchRemoteOnce(): Promise<CompraRemoteState | null> {
  const snapshot = await get(ref(database, COMPRA_ROOT))
  if (!snapshot.exists()) return null
  return normalizeState(snapshot.val())
}

export async function ensureRemoteSeedIfEmpty(): Promise<CompraRemoteState | null> {
  const current = await fetchRemoteOnce()
  if (current && (current.products.length > 0 || current.lists.length > 0)) {
    return current
  }

  const seeded: CompraRemoteState = {
    products: createSeedProducts(),
    lists: [],
    activeListId: null,
  }

  await set(ref(database, COMPRA_ROOT), toRemotePayload(seeded))
  return seeded
}

export async function pushCompraState(state: CompraRemoteState): Promise<string> {
  const payload = toRemotePayload(state)
  await set(ref(database, COMPRA_ROOT), payload)
  return stateHash(state)
}

/** Une dois estados para 2+ aparelhos na mesma lista (sem perder checks). */
export function mergeStates(
  local: CompraRemoteState,
  remote: CompraRemoteState,
): CompraRemoteState {
  const products = new Map<string, Product>()
  for (const product of remote.products) products.set(product.id, product)
  for (const product of local.products) {
    const other = products.get(product.id)
    if (!other || product.updatedAt >= other.updatedAt) {
      products.set(product.id, product)
    }
  }

  const lists = new Map<string, ShoppingList>()
  for (const list of remote.lists) {
    lists.set(list.id, { ...list, items: [...(list.items ?? [])] })
  }
  for (const list of local.lists) {
    const other = lists.get(list.id)
    if (!other) {
      lists.set(list.id, { ...list, items: [...(list.items ?? [])] })
      continue
    }

    const items = new Map<string, ShoppingItem>()
    for (const item of other.items ?? []) items.set(item.id, item)
    for (const item of list.items ?? []) {
      const existing = items.get(item.id)
      if (!existing) {
        items.set(item.id, item)
        continue
      }
      const preferLocal = list.updatedAt >= other.updatedAt
      items.set(item.id, {
        ...existing,
        name: preferLocal ? item.name : existing.name,
        category: preferLocal ? item.category : existing.category,
        unit: normalizeUnit(preferLocal ? item.unit : existing.unit),
        quantity: preferLocal ? item.quantity : existing.quantity,
        productId: preferLocal
          ? (item.productId ?? existing.productId)
          : (existing.productId ?? item.productId),
        notes: preferLocal
          ? (item.notes ?? existing.notes)
          : (existing.notes ?? item.notes),
        // No mercado, o marcado em qualquer aparelho vale.
        checked: Boolean(existing.checked || item.checked),
      })
    }

    lists.set(list.id, {
      ...other,
      name: list.updatedAt >= other.updatedAt ? list.name : other.name,
      updatedAt:
        list.updatedAt >= other.updatedAt ? list.updatedAt : other.updatedAt,
      items: [...items.values()],
    })
  }

  return {
    products: [...products.values()],
    lists: [...lists.values()],
    activeListId: local.activeListId ?? remote.activeListId,
    updatedAt: local.updatedAt ?? remote.updatedAt,
  }
}

export function subscribeCompra(
  onChange: (state: CompraRemoteState) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onValue(
    ref(database, COMPRA_ROOT),
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange({ products: [], lists: [], activeListId: null })
        return
      }
      onChange(normalizeState(snapshot.val()))
    },
    (error) => onError?.(error),
  )
}

export function setFirebaseConnection(online: boolean): void {
  try {
    if (online) goOnline(database)
    else goOffline(database)
  } catch {
    // ignore
  }
}
