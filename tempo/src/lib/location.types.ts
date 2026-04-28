export interface LocationCoordinates {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: number
}

export interface LocationName {
  address?: string
  city?: string
  region?: string
  country?: string
}
