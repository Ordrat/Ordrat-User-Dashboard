'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import type { MapMouseEvent } from '@vis.gl/react-google-maps';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND = '#B91C1C';
const BRAND_DARK = '#7f1d1d';
const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 }; // Cairo
// DEMO_MAP_ID is Google's special placeholder for AdvancedMarker in dev/test
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

// ─── Coverage circle (imperative Maps API) ────────────────────────────────────

function CoverageCircle({
  center,
  radius,
}: {
  center: google.maps.LatLngLiteral | null;
  radius: number;
}) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map || !center || radius <= 0) {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
      return;
    }

    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map,
        center,
        radius,
        fillColor: BRAND,
        fillOpacity: 0.12,
        strokeColor: BRAND,
        strokeOpacity: 0.85,
        strokeWeight: 2,
        clickable: false,
      });
    } else {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radius);
    }

    return () => {
      circleRef.current?.setMap(null);
      circleRef.current = null;
    };
  }, [map, center, radius]);

  return null;
}

// ─── Pan map to new lat/lng (on search result) ────────────────────────────────

function MapPanner({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prevRef = useRef({ lat, lng });

  useEffect(() => {
    if (!map) return;
    const prev = prevRef.current;
    const moved =
      Math.abs(lat - prev.lat) > 0.0001 || Math.abs(lng - prev.lng) > 0.0001;
    if (moved && (lat !== 0 || lng !== 0)) {
      map.panTo({ lat, lng });
    }
    prevRef.current = { lat, lng };
  }, [map, lat, lng]);

  return null;
}

// ─── Nominatim geocoding (free, no key needed) ────────────────────────────────

async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } },
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name;
  } catch {
    return undefined;
  }
}

async function geocodeSearch(
  query: string,
): Promise<{ lat: number; lng: number; label: string } | null> {
  try {
    const params = new URLSearchParams({ q: query, format: 'json', limit: '1' });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    if (!data[0]) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      label: data[0].display_name,
    };
  } catch {
    return null;
  }
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface LocationPickerProps {
  lat: number;
  lng: number;
  radius: number;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
}

export function LocationPicker({ lat, lng, radius, onLocationChange }: LocationPickerProps) {
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const hasPosition = lat !== 0 || lng !== 0;
  const position: google.maps.LatLngLiteral | null = hasPosition ? { lat, lng } : null;
  const defaultCenter = hasPosition ? { lat, lng } : DEFAULT_CENTER;

  const handleMapClick = useCallback(
    async (e: MapMouseEvent) => {
      const clickLat = e.detail.latLng?.lat;
      const clickLng = e.detail.latLng?.lng;
      if (clickLat == null || clickLng == null) return;
      const address = await reverseGeocode(clickLat, clickLng);
      onLocationChange(clickLat, clickLng, address);
    },
    [onLocationChange],
  );

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    const result = await geocodeSearch(q);
    setIsSearching(false);
    if (result) onLocationChange(result.lat, result.lng, result.label);
  }, [searchQuery, onLocationChange]);

  if (!API_KEY) {
    return (
      <div className="h-52 rounded-lg border border-dashed border-border bg-muted flex items-center justify-center text-sm text-muted-foreground text-center px-4">
        Add <code className="mx-1 font-mono text-xs bg-background px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to <code className="mx-1 font-mono text-xs bg-background px-1 rounded">.env.local</code>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <div className="space-y-2">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder={t('branches.searchLocation')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            disabled={isSearching}
          />
        </div>

        {/* Map */}
        <div className="h-56 w-full rounded-lg border border-border overflow-hidden">
          <Map
            defaultCenter={defaultCenter}
            defaultZoom={11}
            mapId={MAP_ID}
            gestureHandling="cooperative"
            disableDefaultUI={false}
            zoomControl
            fullscreenControl={false}
            streetViewControl={false}
            mapTypeControl={false}
            onClick={handleMapClick}
            style={{ height: '100%', width: '100%' }}
          >
            <MapPanner lat={lat} lng={lng} />

            {/* Circle always visible — uses selected position or default center */}
            <CoverageCircle center={position ?? defaultCenter} radius={radius} />

            {/* Marker only after location is selected */}
            {position && (
              <AdvancedMarker position={position}>
                <Pin
                  background={BRAND}
                  glyphColor="white"
                  borderColor={BRAND_DARK}
                  scale={1.3}
                />
              </AdvancedMarker>
            )}
          </Map>
        </div>
      </div>
    </APIProvider>
  );
}
