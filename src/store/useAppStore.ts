import { create } from 'zustand'
import {
  bindSyncEngine,
  retryCloudSync,
  schedulePersistAndSync,
} from '../sync/engine'
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
  online: boolean
  dirty: boolean
  setView: (view: AppView) => void
  setHydrated: (value: boolean) => void
  setSyncError: (error: string | null) => void
  retrySync: () => void
  replaceFromRemote: (
    data: {
      products: Product[]
      lists: ShoppingList[]
      activeListId: string | null
    },
    opts?: { clearDirty?: boolean },
  ) => void
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

let applyingRemote = false

function touch() {
  if (!applyingRemote) schedulePersistAndSync()
}

export const useAppStore = create<AppState>()((set, get) => {
  const store: AppState = {
    products: [],
    lists: [],
    activeListId: null,
    view: 'estoque',
    hydrated: false,
    syncing: false,
    syncError: null,
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    dirty: false,

    setView: (view) => set({ view }),
    setHydrated: (value) => set({ hydrated: value }),
    setSyncError: (error) => set({ syncError: error }),

    retrySync: () => {
      retryCloudSync()
    },

    replaceFromRemote: (data, opts) => {
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
        ...(opts?.clearDirty ? { dirty: false } : {}),
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
      touch()
    },

    updateProduct: (id, data) => {
      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? { ...p, ...data, updatedAt: now() } : p,
        ),
      }))
      touch()
    },

    deleteProduct: (id) => {
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }))
      touch()
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
      touch()
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
      touch()
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
      touch()
      return id
    },

    setActiveList: (id) => {
      set({ activeListId: id })
      touch()
    },

    renameList: (id, name) => {
      set((state) => ({
        lists: state.lists.map((l) =>
          l.id === id ? { ...l, name, updatedAt: now() } : l,
        ),
      }))
      touch()
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
      touch()
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
      touch()
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
      touch()
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
      touch()
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
      touch()
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
      touch()
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
      touch()
    },

    getLowStockProducts: () =>
      (get().products ?? []).filter((p) => p.quantity <= p.minQuantity),
  }

  bindSyncEngine({
    get: () => get(),
    set: (partial) => set(partial),
    replaceFromRemote: (data, opts) => store.replaceFromRemote(data, opts),
    setHydrated: (value) => set({ hydrated: value }),
  })

  return store
})

export type ProductInput = {
  name: string
  category: CategoryId
  quantity: number
  minQuantity: number
  unit: Unit
  notes?: string
}
