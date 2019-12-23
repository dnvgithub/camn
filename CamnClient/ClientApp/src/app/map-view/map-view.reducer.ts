import { ActionReducer, createSelector } from '@ngrx/store';
import { MapViewState, initialMapViewsState, noLoadedMapView } from './map-view.state';
import {
  MapViewAction, MapViewActionType, MapViewSet,
  MapViewSetLoadedId, MapViewSetDefault, MapViewSetSharedView
} from './map-view.action';


export function mapViewReducer(
  state: MapViewState = initialMapViewsState,
  action: MapViewAction): MapViewState {
  let isDirty = false;
  let loadedMapViewId = noLoadedMapView;
  switch (action.type) {
    case MapViewActionType.MapViewMarkDirty:
      return Object.assign({}, state, {
        isDirty: true
      });
    case MapViewActionType.MapViewSet:
      loadedMapViewId = (action as MapViewSet).payload.selectedId;
      // An unsaved map view is dirty from the start
      if (noLoadedMapView === loadedMapViewId) {
        isDirty = true;
      }
      return Object.assign({}, state, {
        mapViews: (action as MapViewSet).payload.views,
        loadedMapViewId: loadedMapViewId,
        isDirty: isDirty,
        isShared: false,
        sharedMapView: null
      });
    case MapViewActionType.MapViewSetSharedView:
      return Object.assign({}, state, {
        isDirty: true,
        isShared: true,
        loadedMapViewId: noLoadedMapView,
        sharedMapView: (action as MapViewSetSharedView).payload
      });
    case MapViewActionType.MapViewSetLoadedId:
      loadedMapViewId = (action as MapViewSetLoadedId).payload.selectedId;
      // An unsaved map view is dirty from the start
      if (noLoadedMapView === loadedMapViewId) {
        isDirty = true;
      }
      return Object.assign({}, state, {
        isDirty: isDirty,
        isShared: false,
        loadedMapViewId: loadedMapViewId,
        sharedMapView: null
      });
    case MapViewActionType.MapViewClose:
      return Object.assign({}, state, {
        isDirty: true,
        loadedMapViewId: noLoadedMapView
      });
    case MapViewActionType.MapViewSetDefault:
      return Object.assign({}, state, {
        userDefaultMapViewId: (action as MapViewSetDefault).payload
      });
    default:
      return state;
  }
}
