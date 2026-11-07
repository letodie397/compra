import {
  get,
  onValue,
  ref,
  set,
  type Unsubscribe,
} from 'firebase/database'
import { SEED_PRODUCTS } from '../data/seed'
import type { Product, ShoppingList } from '../types'
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

function normalizeState(raw: unknown): CompraRemoteState {
  if (!raw || typeof raw !== 'object') {
    return { products: [], lists: [], activeListId: null }
  }

  const data = raw as {
    products?: Record<string, Product> | Product[]
    lists?: Record<string, ShoppingList> | ShoppingList[]
    activeListId?: string | null
  }

  const products = Array.isArray(data.products)
    ? data.products
    : Object.values(data.products ?? {})

  const lists = Array.isArray(data.lists)
    ? data.lists
    : Object.values(data.lists ?? {})

  return {
    products,
    lists,
    activeListId: data.activeListId ?? null,
  }
}

export function toRemotePayload(state: CompraRemoteState) {
  const products: Record<string, Product> = {}
  for (const product of state.products) {
    products[product.id] = product
  }

  const lists: Record<string, ShoppingList> = {}
  for (const list of state.lists) {
    lists[list.id] = list
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
    return normalizeState(snapshot.val())
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
