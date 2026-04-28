import { useState, useEffect } from 'react'
import { MapPin, Loader, AlertCircle, Check } from 'lucide-react'

interface LocationCoordinates {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: number
}

interface LocationPickerProps {
  value?: LocationCoordinates | string
  onChange: (coords: LocationCoordinates, name: string) => void
  showMap?: boolean
  compact?: boolean
}

export default function LocationPicker({
  value,
  onChange,
  showMap = true,
  compact = false,
}: LocationPickerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [coordinates, setCoordinates] = useState<LocationCoordinates | undefined>()
  const [locationName, setLocationName] = useState<string>('')
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt')

  // Parse string coordinates if provided
  useEffect(() => {
    if (typeof value === 'string' && value.includes(',')) {
      const [lat, lon] = value.split(',').map(Number)
      if (!isNaN(lat) && !isNaN(lon)) {
        setCoordinates({ latitude: lat, longitude: lon })
      }
    } else if (typeof value === 'object' && value) {
      setCoordinates(value)
    }
  }, [value])

  // Check geolocation support and permission status
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt')
      })
    } else if (locationService.isSupported()) {
      setPermissionStatus('prompt')
    }
  }, [])

  const getLocationName = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      )
      const data = await response.json()
      return data.display_name?.split(',')[0] || `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    } catch {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    }
  }

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setLoading(true)
    setError('')

    try {
      await new Promise<LocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords: LocationCoordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy ?? undefined,
              timestamp: position.timestamp,
            }
            resolve(coords)
          },
          (error) => {
            let message = 'Failed to get location'
            if (error.code === 1) message = 'Location permission denied. Please enable location access in your browser settings.'
            else if (error.code === 2) message = 'Location information is unavailable.'
            else if (error.code === 3) message = 'Location request timed out.'
            reject(new Error(message))
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
      }).then(async (coords) => {
      setCoordinates(coords)
      setPermissionStatus('granted')

        const displayName = await getLocationName(coords.latitude, coords.longitude)
      setLocationName(displayName)
      onChange(coords, displayName)
      })
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to get location'
      setError(errorMsg)
      if (
        errorMsg.includes('permission denied') ||
        errorMsg.includes('denied')
      ) {
        setPermissionStatus('denied')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMapSelect = async (coords: LocationCoordinates) => {
    setCoordinates(coords)
    try {
      const displayName = await getLocationName(coords.latitude, coords.longitude)
      setLocationName(displayName)
      onChange(coords, displayName)
    } catch {
      const displayName = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
      setLocationName(displayName)
      onChange(coords, displayName)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleGetCurrentLocation}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background:
              permissionStatus === 'granted'
                ? 'rgba(16,185,129,0.1)'
                : 'rgba(59,130,246,0.1)',
            color: permissionStatus === 'granted' ? '#10b981' : '#3b82f6',
          }}
        >
          {loading ? (
            <Loader size={12} className="animate-spin" />
          ) : permissionStatus === 'granted' ? (
            <Check size={12} />
          ) : (
            <MapPin size={12} />
          )}
          {loading
            ? 'Getting location...'
            : permissionStatus === 'granted'
              ? 'Location enabled'
              : 'Get GPS location'}
        </button>
        {locationName && (
          <span
            className="text-[10px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {locationName}
          </span>
        )}
        {error && (
          <span className="text-[10px]" style={{ color: '#ef4444' }}>
            {error.split('.')[0]}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={handleGetCurrentLocation}
          disabled={loading}
          className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background:
              permissionStatus === 'granted'
                ? 'rgba(16,185,129,0.15)'
                : 'rgba(59,130,246,0.15)',
            color: permissionStatus === 'granted' ? '#10b981' : '#3b82f6',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <>
              <Loader size={14} className="animate-spin" />
              <span>Getting your location...</span>
            </>
          ) : permissionStatus === 'granted' ? (
            <>
              <Check size={14} />
              <span>Location access granted</span>
            </>
          ) : (
            <>
              <MapPin size={14} />
              <span>Use my current location</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div
          className="flex items-start gap-2 p-2.5 rounded-lg text-xs"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
        >
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{error.split('.')[0]}</p>
            {error.includes('permission denied') && (
              <p className="text-[10px] mt-1 opacity-75">
                To enable location access: Click the location icon in your
                address bar and select "Always allow" for this site.
              </p>
            )}
          </div>
        </div>
      )}

      {coordinates && locationName && (
        <div
          className="p-2.5 rounded-lg text-xs"
          style={{
            background: 'rgba(16,185,129,0.1)',
            color: '#10b981',
          }}
        >
          <p className="font-medium">✓ Location detected</p>
          <p className="text-[10px] mt-1">{locationName}</p>
        </div>
      )}

      {/* LocationMap disabled temporarily */}
      {/* {showMap && coordinates && (
        <LocationMap
          coordinates={coordinates}
          onLocationSelect={handleMapSelect}
          onLocationName={setLocationName}
        />
      )} */}
    </div>
  )
}
