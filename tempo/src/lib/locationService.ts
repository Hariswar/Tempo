/**
 * Location Service
 * Handles browser geolocation API with permission management
 */

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

class LocationService {
  private watchId: number | null = null

  /**
   * Request user's current location with browser geolocation API
   */
  async getCurrentLocation(): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          })
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Location permission denied. Please enable location access in your browser settings.'))
              break
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information is unavailable.'))
              break
            case error.TIMEOUT:
              reject(new Error('Location request timed out.'))
              break
            default:
              reject(new Error('An unknown error occurred while retrieving location.'))
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }

  /**
   * Watch user's location continuously
   */
  watchLocation(
    onSuccess: (coords: LocationCoordinates) => void,
    onError: (error: Error) => void
  ): () => void {
    if (!navigator.geolocation) {
      onError(new Error('Geolocation is not supported by this browser'))
      return () => {}
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        onSuccess({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        })
      },
      (error) => {
        let errorMsg = 'Unknown location error'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied'
            break
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable'
            break
          case error.TIMEOUT:
            errorMsg = 'Location request timed out'
            break
        }
        onError(new Error(errorMsg))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    )

    // Return cleanup function
    return () => {
      if (this.watchId !== null) {
        navigator.geolocation.clearWatch(this.watchId)
        this.watchId = null
      }
    }
  }

  /**
   * Reverse geocode coordinates to address (client-side approximation)
   * For production, use a geocoding service like Google Maps, OpenStreetMap, or Nominatim
   */
  async reverseGeocode(lat: number, lon: number): Promise<LocationName> {
    try {
      // Using OpenStreetMap's Nominatim service (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      )
      const data = await response.json()
      const address = data.address || {}

      return {
        address: data.display_name?.split(',')[0] || 'Unknown location',
        city: address.city || address.town || address.village,
        region: address.state,
        country: address.country,
      }
    } catch (error) {
      console.warn('Geocoding failed:', error)
      return {
        address: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      }
    }
  }

  /**
   * Format coordinates as readable string
   */
  formatCoordinates(coords: LocationCoordinates): string {
    return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
  }

  /**
   * Calculate distance between two locations (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Check if geolocation is supported
   */
  isSupported(): boolean {
    return !!navigator.geolocation
  }
}

export const locationService = new LocationService()
