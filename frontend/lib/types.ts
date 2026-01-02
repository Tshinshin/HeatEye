export type Device = {
  id: string
  name: string
  location: string
}

export type Reading = {
  timestamp: string
  value: number
  deviceId: string
}
