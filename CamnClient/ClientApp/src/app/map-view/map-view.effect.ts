import { Injectable } from '@angular/core';
import { Store, Action } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { interval, from, Observable, of, timer, throwError } from 'rxjs';
import { debounceTime, delay, switchMap, withLatestFrom, map, catchError, flatMap, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import {
  SetZoom, CenterMap, SetActiveLayer,
  SetAvailableLayer, UpdateLayerFilter, toWhereClause,
  Layer, DnvFieldFilter, EditShapes
} from 'dnv-lib';
import { ToastUserNotification, DelayedAction, CheckLayerDisplay } from '../state-management/application/application.action';
import {
  MapViewActionType, MapViewMarkDirty, MapViewSaveAs,
  MapViewSet, MapViewSetLoadedId,
  MapViewLoad, MapViewLoadSharedId, MapViewSetSharedView,
  MapViewLoadDefault, MapViewSetDefault,
  MapViewSaveDefault, MapViewDeleteDefault
} from './map-view.action';

import {
  MapView, ViewsAndSelection, noLoadedMapView,
  MapViewSavedData, stringToMapViewSavedData, storeToMapViewSavedDataString,
  isMapViewDirty, currentMapView, initialMapViewsState, MapViewSavedLayer
} from './map-view.state';
import { UpdateURLParams } from '../url-parameters/url-parameters.action';

import { AppState } from '../app.component';
import { environment } from '../../environments/environment';

@Injectable()
export class MapViewEffects {

  hostBaseUrlPrefix = environment.hostBaseUrlPrefix;

  @Effect() mapViewCheckIsDirty$: Observable<Action> = this.actions$.pipe(
    ofType(MapViewActionType.MapViewCheckIsDirty),
    withLatestFrom(this.store$),
    map(([, store]) => {

      const actions: Action[] = [];

      if (!store.mapViewState.isDirty) { // if the status is already dirty, no need to check further
        if (isMapViewDirty(store)) {
          actions.push(new MapViewMarkDirty());
        }
      }

      return { actions: actions };
    }),
    flatMap((v: { actions: Action[] }) => v.actions)
  );

  @Effect() mapViewLoadDefault$: Observable<Action> = this.actions$.pipe(
    ofType(MapViewActionType.MapViewLoadDefault),
    switchMap((action: MapViewLoadDefault) => {

      const actions: Action[] = [];

      return this.httpClient.get<MapView>(this.hostBaseUrlPrefix + 'api/MapView/DefaultMapView/camn')
        .pipe(
          catchError(
            // tslint:disable-next-line: deprecation
            () => of([])
          ),
          map((data: MapView) => {
            if (data) { // data is null if the user does not have any default set
              actions.push(new MapViewSetDefault(data.id));
            }
            return { actions: actions };
          })
        );

    }),
    flatMap((v: { actions: Action[] }) => v.actions)
  );

  @Effect() mapViewSetDefault$: Observable<Action> = this.actions$.pipe(
    ofType(MapViewActionType.MapViewSetDefault),
    map((action: MapViewSetDefault) => {
      const actions: Action[] = [];
      if (action.payload > noLoadedMapView) {
        const viewsAndSelection: ViewsAndSelection = {
          views: [],
          selectedId: action.payload
        };
        actions.push(new MapViewSetLoadedId(viewsAndSelection));
      }
      return { actions: actions };
    }),
    flatMap((v: { actions: Action[] }) => v.actions)
  );

  @Effect() mapViewSaveDefault$: Observable<Action> = this.actions$.pipe(
    ofType(MapViewActionType.MapViewSaveDefault),
    switchMap((action: MapViewSaveDefault) => {

      const headers: HttpHeaders = new HttpHeaders().set('content-type', 'application/json');
      return this.httpClient.post<MapView>(this.hostBaseUrlPrefix + 'api/MapView/DefaultMapViewSave', action.payload, { headers })
        .pipe(
          catchError(
            // tslint:disable-next-line: deprecation
            () => of(initialMapViewsState)
          )
        );

    }),
    flatMap((action: MapView) => [new MapViewSetDefault(action.id)])
  );

  @Effect() mapViewDeleteDefault$: Observable<Action> = this.actions$.pipe(
    ofType(MapViewActionType.MapViewDeleteDefault),
    switchMap((action: MapViewDeleteDefault) => {

      const headers: HttpHeaders = new HttpHeaders().set('content-type', 'application/json');
      return this.httpClient.post<MapView>(this.hostBaseUrlPrefix + 'api/MapView/DefaultMapViewDelete', action.payload, { headers })
        .pipe(
          catchError(
            // tslint:disable-next-line: deprecation
            () => of(initialMapViewsState)
          )
        );

    }),
    flatMap(action => [new MapViewSetDefault(noLoadedMapView)])
  );

  @Effect() mapViewLoad$: Observable<Action> = this.actions$.pipe(
    ofType(MapViewActionType.MapViewLoad),
    switchMap((action: MapViewLoad): Observable<MapViewSet> => {
      return this.httpClient.get<MapView[]>(this.hostBaseUrlPrefix + 'api/MapView/MapViews/camn')
        .pipe(
          catchError(
            // tslint:disable-next-line: deprecation
            () => of([])
          ),
          map((data: MapView[]) => {
            const viewsAndSelection: ViewsAndSelection = {
              views: data,
              selectedId: action.payload.selectedId
            };
            return new MapViewSet(viewsAndSelection);
          })
        );

    }),
    flatMap(action => [action])
  );

  @Effect() mapViewLoadSharedId$: Observable<Action> = this.actions$.pipe(
    ofType(MapViewActionType.MapViewLoadSharedId),
    switchMap((action: MapViewLoadSharedId) => {

      return this.httpClient.get<MapView[]>(this.hostBaseUrlPrefix + 'api/MapView/MapViewOpenShared/' + action.payload)
        .pipe(
          catchError(
            // tslint:disable-next-line: deprecation
            () => of([])
          ),
          map((data: MapView[]) => {
            const actions: Action[] = [];

            if (data.length > 0) {
              actions.push(new MapViewSetSharedView(data[0]));
            } else {
              actions.push(new ToastUserNotification({
                type: 'error',
                title: 'Shared Map Not Found',
                message: 'Please contact the sender to request a new link.',
                options: {
                  disableTimeOut: true,
                  closeButton: true
                }
              }));

            }
            return { actions: actions };
          })
        );
    }),
    flatMap((v: { actions: Action[] }) => v.actions)
  );

  @Effect() mapViewSetLoadedId$: Observable<Action> = this.actions$.pipe(
    ofType(MapViewActionType.MapViewSetLoadedId),
    withLatestFrom(this.store$),
    map(([, store]) => {

      let actions: Action[] = [];

      actions.push(new UpdateURLParams());

      const mapView: MapView = currentMapView(store.mapViewState);
      if (mapView) {
        const data: MapViewSavedData = stringToMapViewSavedData(mapView.data);

        actions = this.applySaveData(actions, store, data);
      }

      return { actions: actions };
    }),
    flatMap((v: { actions: Action[] }) => v.actions)
  );

  @Effect() mapViewSetSharedView$: Observable<Action> = this.actions$.pipe(
    ofType(MapViewActionType.MapViewSetSharedView),
    withLatestFrom(this.store$),
    map(([action, store]) => {

      let actions: Action[] = [];
      const mapView: MapView = (action as MapViewSetSharedView).payload;
      const data: MapViewSavedData = stringToMapViewSavedData(mapView.data);

      actions = this.applySaveData(actions, store, data);

      return { actions: actions };
    }),
    flatMap((v: { actions: Action[] }) => v.actions)
  );

  @Effect() mapViewSave$: Observable<Action> = this.actions$.pipe(
    ofType(MapViewActionType.MapViewSave),
    withLatestFrom(this.store$),
    switchMap(([, store]): Observable<MapView> => {

      let mapView: MapView = currentMapView(store.mapViewState);
      if (mapView) {
        mapView = Object.assign({}, mapView, {
          timestamp: new Date().toISOString(),
          data: storeToMapViewSavedDataString(store)
        });
      }

      const headers: HttpHeaders = new HttpHeaders().set('content-type', 'application/json');
      return this.httpClient.post<MapView>(this.hostBaseUrlPrefix + 'api/MapView/MapViewSave', mapView, { headers })
        .pipe(
          catchError(
            // tslint:disable-next-line: deprecation
            () => of(mapView)
          )
        );

    }),
    flatMap((mapView: MapView) => [new MapViewLoad({ views: [], selectedId: mapView.id })])
  );

  @Effect() mapViewSaveAs$: Observable<Action> = this.actions$.pipe(
    ofType(MapViewActionType.MapViewSaveAs),
    withLatestFrom(this.store$),
    switchMap(([action, store]): Observable<MapView> => {

      const mapView: MapView = {
        id: 0,
        userName: '',
        bookmarkName: (action as MapViewSaveAs).payload,
        application: 'camn',
        data: storeToMapViewSavedDataString(store),
        timestamp: new Date().toISOString(),
        shareId: ''
      };

      const headers: HttpHeaders = new HttpHeaders().set('content-type', 'application/json');
      return this.httpClient.post<MapView>(this.hostBaseUrlPrefix + 'api/MapView/MapViewSaveAs', mapView, { headers })
        .pipe(
          catchError(
            // tslint:disable-next-line: deprecation
            () => of(mapView)
          )
        );

    }),
    flatMap((mapView: MapView) => [new UpdateURLParams(), new MapViewLoad({ views: [], selectedId: mapView.id })])

  );

  @Effect() mapViewDelete$: Observable<Action> = this.actions$.pipe(
    ofType(MapViewActionType.MapViewDelete),
    withLatestFrom(this.store$),
    switchMap(([, store]): Observable<MapView> => {

      const mapView: MapView = {
        id: store.mapViewState.loadedMapViewId,
        userName: '',
        bookmarkName: '',
        application: 'camn',
        data: '',
        timestamp: new Date().toISOString(),
        shareId: ''
      };

      const headers: HttpHeaders = new HttpHeaders().set('content-type', 'application/json');
      return this.httpClient.post<MapView>(this.hostBaseUrlPrefix + 'api/MapView/MapViewDelete', mapView, { headers })
        .pipe(
          catchError(
            // tslint:disable-next-line: deprecation
            () => of(mapView)
          )
        );

    }),
    flatMap((mapView: MapView) => [new MapViewLoad({ views: [], selectedId: noLoadedMapView })])
  );

  applySaveData(actions: Action[], store: AppState, data: MapViewSavedData): Action[] {

    const savedUserLayers: MapViewSavedLayer[] = data.layers || [];
    const savedUserLayersMap: { [id: string]: MapViewSavedLayer } = {};
    savedUserLayers.forEach(l => {
      savedUserLayersMap[l.uid] = l;
    });
    store.layerState.layers.forEach(l => {

      const savedLayer: MapViewSavedLayer = savedUserLayersMap[l.uid];


      // Update filters for each layer
      let updateLayerFilter = false;
      const currentFilter: DnvFieldFilter[] = l.fieldFilters || [];
      let savedFilter: DnvFieldFilter[] = [];
      if (savedLayer) {
        savedFilter = savedLayer.fieldFilters || [];
      }
      if (currentFilter.length !== savedFilter.length) {
        updateLayerFilter = true;
      } else {
        for (let i = 0; i < currentFilter.length; i++) {
          if (
            (currentFilter[i].name !== savedFilter[i].name) ||
            (currentFilter[i].filter !== savedFilter[i].filter)
          ) {
            updateLayerFilter = true;
            break;
          }
        }
      }

      if (updateLayerFilter) {
        actions.push(new UpdateLayerFilter({
          id: l.id,
          newFilters: savedFilter,
          whereClause: toWhereClause(savedFilter),
          layer: l
        }));
      }


      // Determine desired active / available state for each layer
      if (savedLayer) { // Then it needs to be visible / active
        if (l.type !== 0) {
          actions.push(new SetActiveLayer(l));
        }
      } else { // Then it needs to be hidden / available
        if (l.type === 0) {
          actions.push(new SetAvailableLayer(l));
        }
      }

    });

    if (data.features && (data.features.length > 0)) {
      actions.push(new EditShapes(data.features));
    } else {
      actions.push(new EditShapes([]));
    }

    const delayedActions = [];

    const zoomLevel = data.zoomLevel;
    if (!isNaN(zoomLevel)) {
      delayedActions.push(new SetZoom(Number(zoomLevel)));
    }

    const lat = data.lat;
    const lng = data.lng;
    if (lat && lng) {
      delayedActions.push(new CenterMap({ lat: lat, lng: lng }));
    }

    delayedActions.push(new CheckLayerDisplay());

    const delayedAction = new DelayedAction([new DelayedAction(delayedActions)]);
    actions.push(delayedAction);

    return actions;
  }


  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private httpClient: HttpClient
  ) {
  }

}

