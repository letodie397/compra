import { create } from 'zustand'
import { pushCompraState } from '../firebase/sync'
import type {
  AppView,
  CategoryId,
  Product,
  ShoppingItem,
  ShoppingList,
  Unit,
} from '../types'

function uid(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

interface AppState {
  products: Product[]
  lists: ShoppingList[]
  activeListId: string | null
  view: AppView
  hydrated: boolean
  syncing: boolean
  syncError: string | null
  setView: (view: AppView) => void
  setHydrated: (value: boolean) => void
  setSyncError: (error: string | null) => void
  replaceFromRemote: (data: {
    products: Product[]
    lists: ShoppingList[]
    activeListId: string | null
  }) => void
  addProduct: (data: Omit<Product, 'id' | 'updatedAt'>) => void
  updateProduct: (id: string, data: Partial<Omit<Product, 'id'>>) => void
  deleteProduct: (id: string) => void
  adjustQuantity: (id: string, delta: number) => void
  createList: (name?: string) => string
  generateListFromLowStock: (name?: string) => string
  setActiveList: (id: string | null) => void
  renameList: (id: string, name: string) => void
  deleteList: (id: string) => void
  addListItem: (
    listId: string,
    item: Omit<ShoppingItem, 'id' | 'checked'>,
  ) => void
  updateListItem: (
    listId: string,
    itemId: string,
    data: Partial<ShoppingItem>,
  ) => void
  toggleListItem: (listId: string, itemId: string) => void
  removeListItem: (listId: string, itemId: string) => void
  clearCheckedItems: (listId: string) => void
  applyPurchasesToStock: (listId: string) => void
  getLowStockProducts: () => Product[]
}

let syncTimer: ReturnType<typeof setTimeout> | null = null
let applyingRemote = false

function schedulePush(get: () => AppState, set: (partial: Partial<AppState>) => void) {
  if (applyingRemote) return
  if (syncTimer) clearTimeout(syncTimer)

  syncTimer = setTimeout(async () => {
    const state = get()
    set({ syncing: true, syncError: null })
    try {
      await pushCompraState({
        products: state.products,
        lists: state.lists,
        activeListId: state.activeListId,
      })
      set({ syncing: false })
    } catch (error) {
      set({
        syncing: false,
        syncError:
          error instanceof Error
            ? error.message
            : 'Falha ao sincronizar com o Firebase',
      })
    }
  }, 280)
}

export const useAppStore = create<AppState>()((set, get) => ({
  products: [],
  lists: [],
  activeListId: null,
  view: 'estoque',
  hydrated: false,
  syncing: false,
  syncError: null,

  setView: (view) => set({ view }),
  setHydrated: (value) => set({ hydrated: value }),
  setSyncError: (error) => set({ syncError: error }),

  replaceFromRemote: (data) => {
    applyingRemote = true
    set({
      products: Array.isArray(data.products) ? data.products : [],
      lists: (Array.isArray(data.lists) ? data.lists : []).map((list) => ({
        ...list,
        items: Array.isArray(list.items) ? list.items : [],
      })),
      activeListId: data.activeListId ?? null,
      hydrated: true,
      syncError: null,
    })
    queueMicrotask(() => {
      applyingRemote = false
    })
  },

  addProduct: (data) => {
    set((state) => ({
      products: [
        {
          ...data,
          id: uid(),
          updatedAt: now(),
        },
        ...state.products,
      ],
    }))
    schedulePush(get, set)
  },

  updateProduct: (id, data) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: now() } : p,
      ),
    }))
    schedulePush(get, set)
  },

  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }))
    schedulePush(get, set)
  },

  adjustQuantity: (id, delta) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id
          ? {
              ...p,
              quantity: Math.max(0, p.quantity + delta),
              updatedAt: now(),
            }
          : p,
      ),
    }))
    schedulePush(get, set)
  },

  createList: (name = 'Lista de compras') => {
    const id = uid()
    const list: ShoppingList = {
      id,
      name,
      items: [],
      createdAt: now(),
      updatedAt: now(),
    }
    set((state) => ({
      lists: [list, ...state.lists],
      activeListId: id,
      view: 'lista',
    }))
    schedulePush(get, set)
    return id
  },

  generateListFromLowStock: (name = 'Reposição') => {
    const low = get().getLowStockProducts()
    const id = uid()
    const items: ShoppingItem[] = low.map((p) => ({
      id: uid(),
      productId: p.id,
      name: p.name,
      category: p.category,
      quantity: Math.max(1, p.minQuantity - p.quantity),
      unit: p.unit,
      checked: false,
    }))
    const list: ShoppingList = {
      id,
      name,
      items,
      createdAt: now(),
      updatedAt: now(),
    }
    set((state) => ({
      lists: [list, ...state.lists],
      activeListId: id,
      view: 'lista',
    }))
    schedulePush(get, set)
    return id
  },

  setActiveList: (id) => {
    set({ activeListId: id, view: 'lista' })
    schedulePush(get, set)
  },

  renameList: (id, name) => {
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === id ? { ...l, name, updatedAt: now() } : l,
      ),
    }))
    schedulePush(get, set)
  },

  deleteList: (id) => {
    set((state) => {
      const lists = state.lists.filter((l) => l.id !== id)
      return {
        lists,
        activeListId:
          state.activeListId === id
            ? (lists[0]?.id ?? null)
            : state.activeListId,
      }
    })
    schedulePush(get, set)
  },

  addListItem: (listId, item) => {
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: [
                { ...item, id: uid(), checked: false },
                ...(l.items ?? []),
              ],
              updatedAt: now(),
            }
          : l,
      ),
    }))
    schedulePush(get, set)
  },

  updateListItem: (listId, itemId, data) => {
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: (l.items ?? []).map((i) =>
                i.id === itemId ? { ...i, ...data } : i,
              ),
              updatedAt: now(),
            }
          : l,
      ),
    }))
    schedulePush(get, set)
  },

  toggleListItem: (listId, itemId) => {
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: (l.items ?? []).map((i) =>
                i.id === itemId ? { ...i, checked: !i.checked } : i,
              ),
              updatedAt: now(),
            }
          : l,
      ),
    }))
    schedulePush(get, set)
  },

  removeListItem: (listId, itemId) => {
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: (l.items ?? []).filter((i) => i.id !== itemId),
              updatedAt: now(),
            }
          : l,
      ),
    }))
    schedulePush(get, set)
  },

  clearCheckedItems: (listId) => {
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: (l.items ?? []).filter((i) => !i.checked),
              updatedAt: now(),
            }
          : l,
      ),
    }))
    schedulePush(get, set)
  },

  applyPurchasesToStock: (listId) => {
    const list = get().lists.find((l) => l.id === listId)
    if (!list) return

    const checked = (list.items ?? []).filter((i) => i.checked)
    set((state) => {
      let products = [...state.products]

      for (const item of checked) {
        if (item.productId) {
          products = products.map((p) =>
            p.id === item.productId
              ? {
                  ...p,
                  quantity: p.quantity + item.quantity,
                  updatedAt: now(),
                }
              : p,
          )
        } else {
          const existing = products.find(
            (p) =>
              p.name.toLowerCase() === item.name.toLowerCase() &&
              p.category === item.category,
          )
          if (existing) {
            products = products.map((p) =>
              p.id === existing.id
                ? {
                    ...p,
                    quantity: p.quantity + item.quantity,
                    updatedAt: now(),
                  }
                : p,
            )
          } else {
            products = [
              {
                id: uid(),
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                minQuantity: 1,
                unit: item.unit,
                updatedAt: now(),
              },
              ...products,
            ]
          }
        }
      }

      return {
        products,
        lists: state.lists.map((l) =>
          l.id === listId
            ? {
                ...l,
                items: (l.items ?? []).filter((i) => !i.checked),
                updatedAt: now(),
              }
            : l,
        ),
      }
    })
    schedulePush(get, set)
  },

  getLowStockProducts: () =>
    (get().products ?? []).filter((p) => p.quantity <= p.minQuantity),
}))

export type ProductInput = {
  name: string
  category: CategoryId
  quantity: number
  minQuantity: number
  unit: Unit
  notes?: string
}
