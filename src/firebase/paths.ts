export const ROOT = 'icm'

export const paths = {
  technicians: `${ROOT}/technicians`,
  orders: `${ROOT}/orders`,
  orderIndex: (numero: string) => `${ROOT}/indexes/pedidos/${normalizePedidoKey(numero)}`,
  serviceData: (orderId: string) => `${ROOT}/serviceData/${orderId}`,
  signature: (orderId: string) => `${ROOT}/signatures/${orderId}`,
  meta: `${ROOT}/meta`,
  user: (uid: string) => `${ROOT}/users/${uid}`,
  equipmentCounter: (type: string) => `${ROOT}/equipmentCodes/counters/${type}`,
  equipmentItems: `${ROOT}/equipmentCodes/items`,
  equipmentItem: (code: string) => `${ROOT}/equipmentCodes/items/${code}`,
} as const

export function normalizePedidoKey(numero: string): string {
  return numero
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
}
