export interface User {
  id: string
  name: string
  email: string
  password_hash: string
  created_at: string
  updated_at: string
}

export interface UserCreate {
  name: string
  email: string
  password: string
}

export interface UserUpdate {
  name?: string
  email?: string
  password?: string
}

export interface UserDelete {
  id: string
}
