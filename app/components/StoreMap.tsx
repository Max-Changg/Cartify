'use client';

import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { X, MapPin } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
}

interface StoreMapProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: { lat: number; lng: number } | null;
  stores: Store[];
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
};

export function StoreMap({ isOpen, onClose, userLocation, stores }: StoreMapProps) {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [map, setMap] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
    } else {
      // Delay unmounting to allow smooth exit animation
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const onMapLoad = useCallback((mapInstance: any) => {
    setMap(mapInstance);
  }, []);

  const center = userLocation || defaultCenter;

  if (!isMounted) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ease-out ${
        isOpen ? 'bg-black/70 backdrop-blur-md' : 'bg-black/0 backdrop-blur-0'
      }`}
      onClick={onClose}
      style={{
        animation: isOpen ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.3s ease-in',
      }}
    >
      <div 
        className={`relative w-full h-full max-w-7xl max-h-[95vh] m-4 bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ease-out ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: isOpen ? 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-r from-[#14B8A6] via-[#10B981] to-[#14B8A6] p-6 flex items-center justify-between shadow-xl border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/30">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Nearby Grocery Stores</h2>
              <p className="text-sm text-white/90 font-medium">{stores.length} {stores.length === 1 ? 'store' : 'stores'} found nearby</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 hover:rotate-90 group"
            aria-label="Close map"
          >
            <X className="w-6 h-6 text-white group-hover:text-white/90" />
          </button>
        </div>

        {/* Map */}
        <div className="w-full h-full pt-24 relative">
          {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center p-8">
                <p className="text-gray-600 mb-2">Google Maps API key not configured</p>
                <p className="text-sm text-gray-500">Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file</p>
              </div>
            </div>
          ) : loadError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center p-8">
                <p className="text-gray-600 mb-2">Error loading Google Maps</p>
                <p className="text-sm text-gray-500">{loadError.message}</p>
              </div>
            </div>
          ) : !isLoaded ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-[#14B8A6]/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-700 font-medium">Loading map...</p>
                <p className="text-sm text-gray-500 mt-1">Finding nearby stores</p>
              </div>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={13}
              onLoad={onMapLoad}
              options={{
                disableDefaultUI: false,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
              }}
            >
              {/* User location marker */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  title="Your Location"
                />
              )}

              {/* Store markers */}
              {stores.map((store) => (
                <Marker
                  key={store.id}
                  position={{ lat: store.lat, lng: store.lng }}
                  onClick={() => setSelectedStore(store)}
                />
              ))}

              {/* Info window for selected store */}
              {selectedStore && (
                <InfoWindow
                  position={{ lat: selectedStore.lat, lng: selectedStore.lng }}
                  onCloseClick={() => setSelectedStore(null)}
                >
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-900">{selectedStore.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedStore.address}</p>
                    {selectedStore.distance && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedStore.distance.toFixed(1)} miles away
                      </p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>

        {/* Store list sidebar */}
        <div className="absolute top-24 right-0 bottom-0 w-96 bg-white/98 backdrop-blur-xl border-l border-gray-200/30 overflow-hidden shadow-2xl">
          <div className="h-full flex flex-col">
            <div className="p-5 sticky top-0 bg-gradient-to-b from-white/98 to-white/95 backdrop-blur-xl border-b border-gray-200/50 z-10 shadow-sm">
              <h3 className="font-bold text-lg text-gray-900 mb-1">Stores Nearby</h3>
              <p className="text-xs text-gray-500">Click a store to view on map</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {stores.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="font-medium">No stores found nearby</p>
                  <p className="text-sm mt-1">Try expanding your search radius</p>
                </div>
              ) : (
                stores.map((store, index) => (
                  <div
                    key={store.id}
                    onClick={() => setSelectedStore(store)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform ${
                      selectedStore?.id === store.id
                        ? 'border-[#14B8A6] bg-gradient-to-br from-[#14B8A6]/15 to-[#10B981]/10 shadow-lg scale-[1.02] ring-2 ring-[#14B8A6]/20'
                        : 'border-gray-200 hover:border-[#14B8A6]/60 hover:bg-gradient-to-br hover:from-gray-50 hover:to-white hover:shadow-md hover:scale-[1.01]'
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'slideInRight 0.3s ease-out both',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-gray-900 text-base">{store.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{store.address}</p>
                      </div>
                      {store.distance && (
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                            selectedStore?.id === store.id
                              ? 'bg-[#14B8A6] text-white shadow-md'
                              : 'bg-[#14B8A6]/10 text-[#14B8A6]'
                          }`}>
                            {store.distance.toFixed(1)} mi
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

