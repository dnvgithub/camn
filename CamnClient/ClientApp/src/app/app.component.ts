import { Component, OnInit, HostListener } from '@angular/core';

import { ActivatedRoute, Router, CanActivate, ActivatedRouteSnapshot, Params } from '@angular/router';

import { Observable } from 'rxjs';
import { Store, Action } from '@ngrx/store';


import {
  CenterMap, SetZoom, DnvMapAction, SetMapGeoJsonLayers, FitBounds,
  LayerState, Layer as DnvLayer, DnvNavState,
  DnvLatLng, DnvBounds, DnvMapState, SetMapState,
  LoadLayers, SetAvailableLayer, SetActiveLayer,
  DnvLegendState, ToggleLegends, LoadLegendLayers,
  SetSearchItemsUrl, SearchItem, DnvSearchState,
  SetIconsUrl, SetSelectedItem, SearchItemType, initialSearchItem,
  DnvBasemap, LoadBaseMaps, BaseMapState, GetLayersWithIcons
} from 'dnv-lib';

import { getRoutes } from './app.routes';
import { ConfigService } from './services/config.service';

import { ApplicationState } from './state-management/application/application.state';
import {
  UpdateWindowSize, DelayedAction
} from './state-management/application/application.action';

import { StartDraw } from 'dnv-lib';
import { Guid } from 'guid-typescript';
import { MapViewState } from './map-view/map-view.state';
import { MapViewLoad } from './map-view/map-view.action';


export interface AppState {
  mapState: DnvMapState;
  application: ApplicationState;
  layerState: LayerState;
  legendState: DnvLegendState;
  baseMapState: BaseMapState;
  dnvSearchState: DnvSearchState;
  mapViewState: MapViewState;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  application$: Observable<ApplicationState>;
  mapState$: Observable<DnvMapState>;
  public showMeasureTools = false;
  layerState$: Observable<LayerState>;
  legendState$: Observable<DnvLegendState>;
  baseMapState$: Observable<BaseMapState>;
  dnvSearchState$: Observable<DnvSearchState>;
  mapViewState$: Observable<MapViewState>;

  constructor(
    private configService: ConfigService,
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private router: Router
  ) {

    router.resetConfig(getRoutes(configService.defaultPath));
    this.application$ = this.store.select('application');
    this.mapState$ = this.store.select('mapState');
    this.layerState$ = this.store.select('layerState');
    this.legendState$ = this.store.select('legendState');
    this.baseMapState$ = this.store.select('baseMapState');
    this.dnvSearchState$ = this.store.select('dnvSearchState');
    this.mapViewState$ = this.store.select('mapViewState');
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.store.dispatch(new UpdateWindowSize({
      windowInnerHeight: event.target.innerHeight,
      windowInnerWidth: event.target.innerWidth
    }));
  }

  ngOnInit(): void {
    this.store.dispatch(new DelayedAction(
      [
        new SetMapState(this.configService.initialDnvMapState()),
        new DelayedAction([
          new LoadLayers(`${this.configService.webApiEndpoint}layers`),
          new LoadBaseMaps(`${this.configService.webApiEndpoint}basemaps`),
          new SetSearchItemsUrl(`${this.configService.dnvSearchApiEndpoint}api/searchitems`),
          new GetLayersWithIcons(`${this.configService.webApiEndpoint}layers`),
          new DelayedAction([new MapViewLoad()])
        ])
      ]));
  }
  toggleMeasureTools() {
    this.showMeasureTools = !this.showMeasureTools;
  }

  drawShapes(shape: string) {
    const shapeGuid = Guid.create().toString();
    this.store.dispatch(new StartDraw({ shape: shape, guid: shapeGuid }));
  }

}
