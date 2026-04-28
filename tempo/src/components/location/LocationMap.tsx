import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader } from 'lucide-react'

interface LocationCoordinates {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: number
}

interface LocationMapProps {
  coordinates?: LocationCoordinates
  onLocationSelect?: (coords: LocationCoordinates) => void
  onLocationName?: (name: string) => void
  readOnly?: boolean
}

export default function LocationMap({
  coordinates,
  onLocationName,
}: LocationMapProps) {
  const [loading, setLoading] = useState(false)
  const [locationName, setLocationName] = useState<string>('')
  const mapContainerRef = useRef<HTMLDivElement>(null)

  const formatCoordinates = (coords: LocationCoordinates): string => {
    return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
  }

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      )
      const data = await response.json()
      return data.display_name?.split(',')[0] || formatCoordinates({ latitude: lat, longitude: lon })
    } catch {
      return formatCoordinates({ latitude: lat, longitude: lon })
    }
  }

  useEffect(() => {
    if (coordinates && onLocationName && !locationName) {
      setLoading(true)
      reverseGeocode(coordinates.latitude, coordinates.longitude)
        .then((displayName) => {
          setLocationName(displayName)
          onLocationName(displayName)
        })
        .catch((err) => {
          console.error('Reverse geocoding failed:', err)
          setLocationName(formatCoordinates(coordinates))
        })
        .finally(() => setLoading(false))
    }
  }, [coordinates, onLocationName, locationName])

  if (!coordinates) {
    return (
      <div className="w-full h-64 rounded-lg flex items-center justify-center" 
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="text-center">
          <MapPin size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            No location selected
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-2">
      <div 
        ref={mapContainerRef}
        className="w-full h-64 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="text-center">
          <MapPin size={32} className="mx-auto mb-2" style={{ color: 'var(--accent-1)' }} />
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            📍 {formatCoordinates(coordinates)}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Interactive map coming soon...
          </p>
        </div>
      </div>

      {locationName && (
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {loading ? (
            <div className="flex items-center gap-1">
              <Loader size={12} className="animate-spin" />
              <span>Fetching location name...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <MapPin size={12} />
              <span>{locationName}</span>
            </div>
          )}
        </div>
      )}

      {coordinates.accuracy && (
        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Accuracy: ±{Math.round(coordinates.accuracy)}m
        </div>
      )}
    </div>
  )
}
