export type CategoryId =
  | 'limpeza'
  | 'higiene'
  | 'lavanderia'
  | 'cozinha'
  | 'mercearia'
  | 'hortifruti'
  | 'carnes'
  | 'frios'
  | 'bebidas'
  | 'padaria'
  | 'pets'
  | 'outros'

export type Unit = 'un' | 'pct' | 'L' | 'ml' | 'kg' | 'g'

export interface Product {
  id: string
  name: string
  category: CategoryId
  quantity: number
  minQuantity: number
  unit: Unit
  notes?: string
  updatedAt: string
}

export interface ShoppingItem {
  id: string
  productId?: string
  name: string
  category: CategoryId
  quantity: number
  unit: Unit
  checked: boolean
  notes?: string
}

export interface ShoppingList {
  id: string
  name: string
  items: ShoppingItem[]
  createdAt: string
  updatedAt: string
}

export type AppView = 'estoque' | 'lista' | 'comprar'

export interface CatalogItem {
  name: string
  category: CategoryId
  unit: Unit
}
