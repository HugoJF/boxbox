export interface Item {
  id: string
  name: string
  category: string
  description: string
  quantity: number
  image: string
  createdAt: string
}

export interface Box {
  id: string
  name: string
  description: string
  color: string
  itemCount: number
  items: Item[]
  createdAt: string
}
