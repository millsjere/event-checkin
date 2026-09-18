export interface Checkin {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  created_at: string
}

export interface CheckinInput {
  first_name: string
  last_name: string
  phone: string
  email: string
}
