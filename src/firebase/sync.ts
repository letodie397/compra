import {
  get,
  onValue,
  ref,
  set,
  type Unsubscribe,
} from 'firebase/database'
import { SEED_PRODUCTS } from '../data/seed'
import type { Product, ShoppingItem, ShoppingList } from '../types'
import { COMPRA_ROOT, database } from './config'

export interface CompraRemoteState {
  products: Product[]
  lists: ShoppingList[]
  activeListId: string | null
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
    items: asArray<ShoppingItem>(list.items).map((item) => ({
      ...item,
      checked: Boolean(item.checked),
      quantity: Number(item.quantity) || 1,
    })),
  }
}

function normalizeProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== 'object') return null
  const product = raw as Partial<Product>
  if (!product.id || !product.name) return null

  return {
    id: product.id,
    name: product.name,
    category: product.category ?? 'outros',
    quantity: Number(product.quantity) || 0,
    minQuantity: Number(product.minQuantity) || 0,
    unit: product.unit ?? 'un',
    notes: product.notes,
    updatedAt: product.updatedAt ?? now(),
  }
}

function normalizeState(raw: unknown): CompraRemoteState {
  if (!raw || typeof raw !== 'object') {
    return { products: [], lists: [], activeListId: null }
  }

  const data = raw as {
    products?: unknown
    lists?: unknown
    activeListId?: string | null
  }

  return {
    products: asArray<unknown>(data.products)
      .map(normalizeProduct)
      .filter((p): p is Product => p !== null),
    lists: asArray<unknown>(data.lists)
      .map(normalizeList)
      .filter((l): l is ShoppingList => l !== null),
    activeListId: data.activeListId ?? null,
  }
}

export function toRemotePayload(state: CompraRemoteState) {
  const products: Record<string, Product> = {}
  for (const product of state.products) {
    products[product.id] = product
  }

  const lists: Record<
    string,
    Omit<ShoppingList, 'items'> & { items: Record<string, ShoppingItem> }
  > = {}

  for (const list of state.lists) {
    const items: Record<string, ShoppingItem> = {}
    for (const item of list.items ?? []) {
      items[item.id] = item
    }
    lists[list.id] = {
      id: list.id,
      name: list.name,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      items,
    }
  }

  return {
    products,
    lists,
    activeListId: state.activeListId,
    updatedAt: now(),
  }
}

export async function ensureRemoteSeed(): Promise<CompraRemoteState> {
  const root = ref(database, COMPRA_ROOT)
  const snapshot = await get(root)

  if (snapshot.exists()) {
    const current = normalizeState(snapshot.val())
    if (current.products.length > 0 || current.lists.length > 0) {
      return current
    }
  }

  const seeded: CompraRemoteState = {
    products: createSeedProducts(),
    lists: [],
    activeListId: null,
  }

  await set(root, toRemotePayload(seeded))
  return seeded
}

export function subscribeCompra(
  onChange: (state: CompraRemoteState) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const root = ref(database, COMPRA_ROOT)
  return onValue(
    root,
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

export async function pushCompraState(state: CompraRemoteState): Promise<void> {
  await set(ref(database, COMPRA_ROOT), toRemotePayload(state))
}
