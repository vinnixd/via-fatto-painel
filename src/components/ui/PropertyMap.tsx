import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PropertyMapProps {
  address: string;
  zipcode?: string;
  locationType: 'exact' | 'approximate' | 'hidden';
  className?: string;
}

const PropertyMap: React.FC<PropertyMapProps> = ({ address, zipcode, locationType, className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lng: number; lat: number } | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Don't render if location type is hidden
  if (locationType === 'hidden') {
    return null;
  }

  // Fetch Mapbox token and geocode address
  useEffect(() => {
    if (!address) {
      setError('Endereço não disponível');
      setLoading(false);
      return;
    }

    const fetchTokenAndGeocode = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get Mapbox token from edge function
        let tokenData, tokenError;
        try {
          const result = await supabase.functions.invoke('get-mapbox-token');
          tokenData = result.data;
          tokenError = result.error;
        } catch (e) {
          console.error('Failed to invoke get-mapbox-token:', e);
          setError('Mapa não disponível');
          setLoading(false);
          return;
        }
        
        if (tokenError || !tokenData?.token) {
          setError('Mapa não disponível');
          setLoading(false);
          return;
        }

        setMapboxToken(tokenData.token);

        // Geocode address - prioritize CEP (zipcode)
        let geoData, geoError;
        try {
          const result = await supabase.functions.invoke('geocode-address', {
            body: { address, zipcode }
          });
          geoData = result.data;
          geoError = result.error;
        } catch (e) {
          console.error('Failed to invoke geocode-address:', e);
          setError('Localização não disponível');
          setLoading(false);
          return;
        }

        if (geoError || !geoData?.success || !geoData?.coordinates) {
          setError('Localização não encontrada');
          setLoading(false);
          return;
        }

        let { lng, lat } = geoData.coordinates;
        
        // Add some randomness for approximate location
        if (locationType === 'approximate') {
          const offset = 0.005;
          lng += (Math.random() - 0.5) * offset;
          lat += (Math.random() - 0.5) * offset;
        }

        setCoordinates({ lng, lat });
      } catch (err: any) {
        console.error('Map error:', err);
        setError('Mapa indisponível');
      } finally {
        setLoading(false);
      }
    };

    fetchTokenAndGeocode();
  }, [address, zipcode, locationType]);

  // Initialize map when we have coordinates and token
  useEffect(() => {
    if (!mapContainer.current || !coordinates || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [coordinates.lng, coordinates.lat],
      zoom: locationType === 'exact' ? 16 : 14,
      interactive: true,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: false,
      }),
      'top-right'
    );

    // Add marker or circle based on location type
    if (locationType === 'exact') {
      // Exact location - show pin marker
      marker.current = new mapboxgl.Marker({
        color: '#22c55e',
      })
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(map.current);
    } else {
      // Approximate location - show circle
      map.current.on('load', () => {
        if (!map.current) return;

        map.current.addSource('approximate-area', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [coordinates.lng, coordinates.lat],
            },
          },
        });

        // Add circle layer
        map.current.addLayer({
          id: 'approximate-circle',
          type: 'circle',
          source: 'approximate-area',
          paint: {
            'circle-radius': 80,
            'circle-color': '#22c55e',
            'circle-opacity': 0.3,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#22c55e',
            'circle-stroke-opacity': 0.8,
          },
        });
      });
    }

    // Cleanup
    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, [coordinates, mapboxToken, locationType]);

  if (loading) {
    return (
      <div className={`bg-muted rounded-xl flex items-center justify-center ${className}`} style={{ minHeight: '300px' }}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Carregando mapa...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-muted rounded-xl flex items-center justify-center ${className}`} style={{ minHeight: '300px' }}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <MapPin className="h-8 w-8" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-[300px] md:h-[400px]" />
      {locationType === 'approximate' && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-muted-foreground border border-border">
          <MapPin className="h-3 w-3 inline mr-1" />
          Localização aproximada
        </div>
      )}
    </div>
  );
};

export default PropertyMap;
