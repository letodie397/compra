import type { Product } from '../types'

export const SEED_PRODUCTS: Omit<Product, 'id' | 'updatedAt'>[] = [
  {
    name: 'Detergente',
    category: 'limpeza',
    quantity: 2,
    minQuantity: 2,
    unit: 'un',
  },
  {
    name: 'Água sanitária',
    category: 'limpeza',
    quantity: 1,
    minQuantity: 1,
    unit: 'un',
  },
  {
    name: 'Sabão em pó',
    category: 'lavanderia',
    quantity: 0,
    minQuantity: 1,
    unit: 'un',
  },
  {
    name: 'Amaciante',
    category: 'lavanderia',
    quantity: 1,
    minQuantity: 1,
    unit: 'un',
  },
  {
    name: 'Papel higiênico',
    category: 'higiene',
    quantity: 4,
    minQuantity: 6,
    unit: 'un',
  },
  {
    name: 'Sabonete',
    category: 'higiene',
    quantity: 3,
    minQuantity: 2,
    unit: 'un',
  },
  {
    name: 'Shampoo',
    category: 'higiene',
    quantity: 1,
    minQuantity: 1,
    unit: 'un',
  },
  {
    name: 'Óleo de cozinha',
    category: 'cozinha',
    quantity: 1,
    minQuantity: 1,
    unit: 'un',
  },
  {
    name: 'Esponja',
    category: 'cozinha',
    quantity: 0,
    minQuantity: 2,
    unit: 'un',
  },
  {
    name: 'Saco de lixo',
    category: 'outros',
    quantity: 1,
    minQuantity: 2,
    unit: 'un',
  },
]
