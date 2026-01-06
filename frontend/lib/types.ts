export type Device = {
  id: string
  name: string
  latestval: number
  location: string
}

export type Reading = {
  timestamp: string
  value: number
  deviceId: string
}
