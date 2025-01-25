export interface User {
  id: string
  name: string
  email?: string
  phone: string
  rewardsPoints: number
}

export type { CartItem, CartState, PaymentIntent } from './cart'

export { type Product } from './product'
export type { Order, OrderItem, OrderStatus, OrderRecord } from './orders'

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  status: OrderStatus
  total: number
  deliveryFee: number
  address: Address
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  instructions?: string
}