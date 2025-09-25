'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Interfaces para Mapbox
 */
export interface MapboxConfig {
  accessToken?: string;
  style?: string;
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  interactive?: boolean;
  attributionControl?: boolean;
  logoControl?: boolean;
}

export interface MapboxMarker {
  id: string;
  coordinates: [number, number];
  color?: string;
  popup?: string;
  draggable?: boolean;
  element?: HTMLElement;
}

export interface MapboxLayer {
  id: string;
  type: 'line' | 'fill' | 'circle' | 'symbol' | 'raster' | 'heatmap';
  source: any;
  layout?: any;
  paint?: any;
  minzoom?: number;
  maxzoom?: number;
}

export interface UseMapboxReturn {
  mapRef: React.RefObject<any>;
  map: any | null;
  isLoaded: boolean;
  loading: boolean;
  error: string | null;
  initializeMap: (container: HTMLElement, config: MapboxConfig) => Promise<void>;
  addMarker: (marker: MapboxMarker) => void;
  removeMarker: (markerId: string) => void;
  clearMarkers: () => void;
  addLayer: (layer: MapboxLayer) => void;
  removeLayer: (layerId: string) => void;
  flyTo: (coordinates: [number, number], zoom?: number) => void;
  fitBounds: (bounds: [[number, number], [number, number]]) => void;
  getCenter: () => [number, number] | null;
  getZoom: () => number | null;
  getBounds: () => [[number, number], [number, number]] | null;
  onMapClick: (callback: (coordinates: [number, number]) => void) => void;
  offMapClick: () => void;
  cleanup: () => void;
}

/**
 * Hook para gestión de Mapbox
 */
export const useMapbox = (): UseMapboxReturn => {
  const mapRef = useRef<any>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<Map<string, any>>(new Map());
  const [clickHandler, setClickHandler] = useState<((e: any) => void) | null>(null);

  // Inicializar mapa
  const initializeMap = useCallback(async (container: HTMLElement, config: MapboxConfig) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar que mapbox-gl esté disponible
      if (typeof window === 'undefined' || !(window as any).mapboxgl) {
        throw new Error('Mapbox GL JS no está cargado');
      }

      const mapboxgl = (window as any).mapboxgl;

      // Configurar token de acceso
      if (config.accessToken) {
        mapboxgl.accessToken = config.accessToken;
      }

      // Crear instancia del mapa
      const mapInstance = new mapboxgl.Map({
        container,
        style: config.style || 'mapbox://styles/mapbox/streets-v11',
        center: config.center || [-58.3816, -34.6037], // Buenos Aires por defecto
        zoom: config.zoom || 10,
        bearing: config.bearing || 0,
        pitch: config.pitch || 0,
        interactive: config.interactive !== false,
        attributionControl: config.attributionControl !== false,
        logoControl: config.logoControl !== false
      });

      // Esperar a que el mapa se cargue
      await new Promise<void>((resolve, reject) => {
        mapInstance.on('load', () => {
          setIsLoaded(true);
          resolve();
        });

        mapInstance.on('error', (e: any) => {
          reject(new Error(`Error al cargar el mapa: ${e.error?.message || 'Desconocido'}`));
        });

        // Timeout de seguridad
        setTimeout(() => {
          reject(new Error('Timeout al cargar el mapa'));
        }, 10000);
      });

      mapRef.current = mapInstance;
      setMap(mapInstance);
      setLoading(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al inicializar el mapa';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  // Agregar marcador
  const addMarker = useCallback((marker: MapboxMarker) => {
    if (!map || typeof window === 'undefined') return;

    const mapboxgl = (window as any).mapboxgl;

    // Crear elemento del marcador si no se proporciona
    let markerElement = marker.element;
    if (!markerElement) {
      markerElement = document.createElement('div');
      markerElement.className = 'mapbox-marker';
      markerElement.style.backgroundColor = marker.color || '#3B82F6';
      markerElement.style.width = '20px';
      markerElement.style.height = '20px';
      markerElement.style.borderRadius = '50%';
      markerElement.style.border = '2px solid white';
      markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    }

    // Crear marcador de Mapbox
    const mapboxMarker = new mapboxgl.Marker({
      element: markerElement,
      draggable: marker.draggable || false
    })
      .setLngLat(marker.coordinates)
      .addTo(map);

    // Agregar popup si se proporciona
    if (marker.popup) {
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(marker.popup);
      mapboxMarker.setPopup(popup);
    }

    // Guardar referencia del marcador
    setMarkers(current => new Map(current.set(marker.id, mapboxMarker)));
  }, [map]);

  // Remover marcador
  const removeMarker = useCallback((markerId: string) => {
    const marker = markers.get(markerId);
    if (marker) {
      marker.remove();
      setMarkers(current => {
        const newMarkers = new Map(current);
        newMarkers.delete(markerId);
        return newMarkers;
      });
    }
  }, [markers]);

  // Limpiar todos los marcadores
  const clearMarkers = useCallback(() => {
    markers.forEach(marker => marker.remove());
    setMarkers(new Map());
  }, [markers]);

  // Agregar capa
  const addLayer = useCallback((layer: MapboxLayer) => {
    if (!map || !isLoaded) return;

    try {
      // Agregar fuente si no existe
      if (!map.getSource(layer.id)) {
        map.addSource(layer.id, layer.source);
      }

      // Agregar capa si no existe
      if (!map.getLayer(layer.id)) {
        const layerConfig: any = {
          id: layer.id,
          type: layer.type,
          source: layer.id
        };

        if (layer.layout) layerConfig.layout = layer.layout;
        if (layer.paint) layerConfig.paint = layer.paint;
        if (layer.minzoom) layerConfig.minzoom = layer.minzoom;
        if (layer.maxzoom) layerConfig.maxzoom = layer.maxzoom;

        map.addLayer(layerConfig);
      }
    } catch (err) {
      console.error('Error agregando capa:', err);
    }
  }, [map, isLoaded]);

  // Remover capa
  const removeLayer = useCallback((layerId: string) => {
    if (!map || !isLoaded) return;

    try {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(layerId)) {
        map.removeSource(layerId);
      }
    } catch (err) {
      console.error('Error removiendo capa:', err);
    }
  }, [map, isLoaded]);

  // Volar a ubicación
  const flyTo = useCallback((coordinates: [number, number], zoom?: number) => {
    if (!map) return;

    map.flyTo({
      center: coordinates,
      zoom: zoom || map.getZoom(),
      essential: true
    });
  }, [map]);

  // Ajustar vista a bounds
  const fitBounds = useCallback((bounds: [[number, number], [number, number]]) => {
    if (!map) return;

    map.fitBounds(bounds, {
      padding: 20,
      essential: true
    });
  }, [map]);

  // Obtener centro del mapa
  const getCenter = useCallback((): [number, number] | null => {
    if (!map) return null;
    const center = map.getCenter();
    return [center.lng, center.lat];
  }, [map]);

  // Obtener zoom del mapa
  const getZoom = useCallback((): number | null => {
    if (!map) return null;
    return map.getZoom();
  }, [map]);

  // Obtener bounds del mapa
  const getBounds = useCallback((): [[number, number], [number, number]] | null => {
    if (!map) return null;
    const bounds = map.getBounds();
    return [
      [bounds.getWest(), bounds.getSouth()],
      [bounds.getEast(), bounds.getNorth()]
    ];
  }, [map]);

  // Escuchar clicks en el mapa
  const onMapClick = useCallback((callback: (coordinates: [number, number]) => void) => {
    if (!map) return;

    const handler = (e: any) => {
      callback([e.lngLat.lng, e.lngLat.lat]);
    };

    map.on('click', handler);
    setClickHandler(() => handler);
  }, [map]);

  // Remover listener de clicks
  const offMapClick = useCallback(() => {
    if (!map || !clickHandler) return;

    map.off('click', clickHandler);
    setClickHandler(null);
  }, [map, clickHandler]);

  // Limpiar recursos
  const cleanup = useCallback(() => {
    if (clickHandler) {
      offMapClick();
    }
    clearMarkers();
    if (map) {
      map.remove();
      setMap(null);
      setIsLoaded(false);
    }
  }, [map, clickHandler, offMapClick, clearMarkers]);

  // Cleanup al desmontar
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    mapRef,
    map,
    isLoaded,
    loading,
    error,
    initializeMap,
    addMarker,
    removeMarker,
    clearMarkers,
    addLayer,
    removeLayer,
    flyTo,
    fitBounds,
    getCenter,
    getZoom,
    getBounds,
    onMapClick,
    offMapClick,
    cleanup
  };
};

/**
 * Hook para rutas de Strava en Mapbox
 */
export const useStravaRoute = () => {
  const [routeLayer, setRouteLayer] = useState<MapboxLayer | null>(null);

  const addStravaRoute = useCallback((
    mapbox: UseMapboxReturn,
    routeData: any,
    layerId: string = 'strava-route'
  ) => {
    if (!routeData || !mapbox.map) return;

    try {
      // Remover capa anterior si existe
      mapbox.removeLayer(layerId);

      // Crear capa de ruta
      const layer: MapboxLayer = {
        id: layerId,
        type: 'line',
        source: {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: routeData
          }
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#FF6B35',
          'line-width': 4,
          'line-opacity': 0.8
        }
      };

      mapbox.addLayer(layer);
      setRouteLayer(layer);

      // Ajustar vista a la ruta
      if (routeData.coordinates && routeData.coordinates.length > 0) {
        const coordinates = routeData.coordinates;
        const bounds: [[number, number], [number, number]] = [
          [
            Math.min(...coordinates.map((coord: [number, number]) => coord[0])),
            Math.min(...coordinates.map((coord: [number, number]) => coord[1]))
          ],
          [
            Math.max(...coordinates.map((coord: [number, number]) => coord[0])),
            Math.max(...coordinates.map((coord: [number, number]) => coord[1]))
          ]
        ];
        mapbox.fitBounds(bounds);
      }

    } catch (error) {
      console.error('Error agregando ruta de Strava:', error);
    }
  }, []);

  const removeStravaRoute = useCallback((
    mapbox: UseMapboxReturn,
    layerId: string = 'strava-route'
  ) => {
    mapbox.removeLayer(layerId);
    setRouteLayer(null);
  }, []);

  return {
    routeLayer,
    addStravaRoute,
    removeStravaRoute
  };
};

/**
 * Hook para geocodificación con Mapbox
 */
export const useMapboxGeocoding = (accessToken?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, options: {
    limit?: number;
    proximity?: [number, number];
    country?: string;
    types?: string[];
  } = {}): Promise<any[]> => {
    if (!query.trim()) return [];

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query,
        access_token: accessToken || '',
        limit: (options.limit || 5).toString(),
        language: 'es'
      });

      if (options.proximity) {
        params.append('proximity', options.proximity.join(','));
      }

      if (options.country) {
        params.append('country', options.country);
      }

      if (options.types) {
        params.append('types', options.types.join(','));
      }

      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`);

      if (!response.ok) {
        throw new Error(`Error en geocodificación: ${response.status}`);
      }

      const data = await response.json();
      setLoading(false);

      return data.features || [];

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en geocodificación';
      setError(errorMessage);
      setLoading(false);
      return [];
    }
  }, [accessToken]);

  const reverseGeocode = useCallback(async (coordinates: [number, number]): Promise<any | null> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        access_token: accessToken || '',
        language: 'es'
      });

      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?${params}`);

      if (!response.ok) {
        throw new Error(`Error en geocodificación reversa: ${response.status}`);
      }

      const data = await response.json();
      setLoading(false);

      return data.features && data.features.length > 0 ? data.features[0] : null;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en geocodificación reversa';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, [accessToken]);

  return {
    search,
    reverseGeocode,
    loading,
    error
  };
};