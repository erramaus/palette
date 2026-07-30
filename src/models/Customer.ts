import type { Address, Customer as CustomerShape } from '../types/entities'
import { createEntityId } from '../utils/id'
import { BaseEntity, type EntityInit } from './BaseEntity'

export class Customer extends BaseEntity implements CustomerShape {
  name: string
  email?: string
  phone?: string
  billingAddress?: Address
  shippingAddress?: Address
  orderIds: string[]
  isActive: boolean

  constructor(init: EntityInit<CustomerShape>) {
    super(init)
    this.id = init.id ?? createEntityId('customer')
    this.name = init.name
    this.email = init.email
    this.phone = init.phone
    this.billingAddress = init.billingAddress
    this.shippingAddress = init.shippingAddress
    this.orderIds = init.orderIds ?? []
    this.isActive = init.isActive
  }
}
