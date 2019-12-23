import { AppState } from '../app.component';
import {
  DnvMapComponent,
  DnvFieldFilter,
  DnvDrawnShapes,
  exportDnvDrawnShape
} from 'dnv-lib';

export const noLoadedMapView = -1;

export interface MapViewState {
  // Save is only allowed if a view owned by the user was loaded and the map-view is dirty
  isDirty: boolean;
  isShared: boolean;
  loadedMapViewId: number;
  userDefaultMapViewId: number;
  mapViews: MapView[];
  sharedMapView: MapView;
}

export function currentMapView(mapViewState: MapViewState) {
  let mapView: MapView = null;
  const id = mapViewState.loadedMapViewId;

  if (id >= 0) {
    const index: number = mapViewState.mapViews.findIndex(m => m.id === id);
    if (index >= 0) {
      mapView = mapViewState.mapViews[index];
    }
  } else {
    if (mapViewState.isShared) {
      mapView = mapViewState.sharedMapView;
    }
  }

  return mapView;
}

export interface MapView {
  id: number;
  userName: string;
  bookmarkName: string;
  application: string;
  data: any;
  timestamp: any;
  shareId: string;
}

export const initialMapViewsState: MapViewState = {
  isDirty: true,
  isShared: false,
  loadedMapViewId: noLoadedMapView,
  userDefaultMapViewId: noLoadedMapView,
  mapViews: [],
  sharedMapView: null
};

export interface ViewsAndSelection {
  views: MapView[];
  selectedId: number;
}

export const initialViewsAndSelection: ViewsAndSelection = {
  views: [],
  selectedId: noLoadedMapView
};

export interface MapViewSavedData {
  version: number;
  zoomLevel: number;
  lat: number;
  lng: number;
  layers: any[];
  features: DnvDrawnShapes[];
}

export const initialMapViewSavedData: MapViewSavedData = {
  version: 3,
  zoomLevel: 0,
  lat: 0,
  lng: 0,
  layers: [],
  features: []
};

export interface MapViewSavedLayer {
  uid: string;
  fieldFilters: DnvFieldFilter[];
}

export function storeToMapViewSavedDataString(store: AppState) {

  const layers: MapViewSavedLayer[] = storeToMapViewSavedLayerArray(store);

  const features = store.mapState.features.map(f => exportDnvDrawnShape(f));

  const mapViewSavedData: MapViewSavedData = Object.assign({}, initialMapViewSavedData, {
    zoomLevel: store.mapState.zoomLevel,
    lat: store.mapState.centerPoint.lat,
    lng: store.mapState.centerPoint.lng,
    layers: layers,
    features: features
  });

  return JSON.stringify(mapViewSavedData);
}

export function storeToMapViewSavedLayerArray(store: AppState): MapViewSavedLayer[] {
  return store.layerState.layers
    .filter(l => l.type === 0) // Active layers
    .map(l => {
      return Object.assign({}, {}, {
        uid: l.uid,
        fieldFilters: [...l.fieldFilters]
      });
    });
}

export function mapViewSavedDataToString(data: MapViewSavedData): string {
  return JSON.stringify(data);
}

export function stringToMapViewSavedData(s: string): MapViewSavedData {
  const o: Object = JSON.parse(s);

  switch (o['version']) {
    case 3:
      return (o as MapViewSavedData);
    default:
      const mapViewSavedData: MapViewSavedData = Object.assign({}, initialMapViewSavedData, {});

      const zoomLevel = o['zoomLevel'];
      if (!isNaN(zoomLevel)) {
        mapViewSavedData.zoomLevel = zoomLevel;
      }

      const lat = o['lat'];
      const lng = o['lng'];
      if (lat && lng) {
        mapViewSavedData.lat = lat;
        mapViewSavedData.lng = lng;
      }

      const layers: DnvFieldFilter[] = o['layers'];
      if (layers) {
        mapViewSavedData.layers = layers;
      }

      const features: DnvDrawnShapes[] = o['features'];
      if (features) {
        mapViewSavedData.features = features;
      }

      return mapViewSavedData;
  }
}

export function isMapViewDirty(store: AppState): boolean {
  const mapView: MapView = currentMapView(store.mapViewState);

  if (mapView) {
    const mapViewSavedData = stringToMapViewSavedData(mapView.data);

    return !(
      (store.mapState.zoomLevel === mapViewSavedData.zoomLevel)
      && DnvMapComponent.isNearby(store.mapState.centerPoint, { lat: mapViewSavedData.lat, lng: mapViewSavedData.lng }, 0.0001)
      && (JSON.stringify(storeToMapViewSavedLayerArray(store)) === JSON.stringify(mapViewSavedData.layers))
    );

  }

  return true;
}
