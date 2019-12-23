import {
  Component, OnInit, ChangeDetectionStrategy,
  ElementRef, ViewChildren, QueryList,
  AfterViewInit, HostListener, ViewChild, NgZone
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';



import { Observable, Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import { takeUntil } from 'rxjs/operators';


import {
  DnvLayerActionType,
  DnvMapState, CenterMap, SetZoom, DnvMapAction, DnvLatLng, SelectFeature,
  DnvMapActionType, LayerState,
  Layer as DnvLayer, SetAvailableLayer, SetActiveLayer, SetMapFeatureLayers, ZoomToFeatures,
  FeatureFilterUpdate, QueryLayerFeatureCount, ToggleShowFilterPanel, UpdateLayerFilter,
  BaseMapState, SetBaseMaps, DnvBasemap, LoadBaseMaps, SetBaseMapSelected, ToggleBasemaps, CloseBasemaps
  , SetMapBasemaps, DnvSearchState, SearchItem,
  initialSearchItem, SetSelectedItem, SetMapGeoJsonLayers,
  HideFilterPanel, ToggleFeaturePanel, ResetSelected
  , DnvMapInfo, FeatureClicked, CheckInspection,
  DnvFeatureLayer, SetHighlightFeature,
  SetSelectedSurroundingFeature, SetSurroundingFeatureList,
  SetSelectedFeatureLayer,
  DnvLegendState, LoadActiveLegendLayers, SetLegendLayers, LegendLayer, GetInspAttachment, InspectionClicked, FeatureClickedPayload
} from 'dnv-lib';

import { ConfigService } from '../services/config.service';
import { UpdateURLParams, SetStateFromParams } from '../url-parameters/url-parameters.action';

import {
  ApplicationState, ApplicationStatus, GetInspAttachmentPayload,
  getLastSelectedFeatureSelector, getInspectionFieldsSelector,
  lastSelectedFeatureUrlInfo, FeatureUrlInfo
} from '../state-management/application/application.state';

import {
  ToastUserNotification, SetCCTVNotes,
  SaveNewInspection, DelayedAction
} from '../state-management/application/application.action';

import {
  CheckLayerDisplay, Layer, Idle, Search,
  GetFlowWorksData, SetExternalFeature,
  SetFeatureAttachment, SetInspection,
  IdentifySurroundingFeature, SetSurroundingFeature,
  GetFeatureData, SetInspectionFields, Legend, GetAssetConditionData, SetInspectionAttachments, SetDownloadLink, ToggleAlert, GetCCTVNotes
} from '../state-management/application/application.action';
import { AppState } from '../app.component';
import { SearchedInfo } from '../models/search-info';
import { MapViewAction, MapViewCheckIsDirty, MapViewMarkDirty } from '../map-view/map-view.action';
import { MapViewState, currentMapView } from '../map-view/map-view.state';
import { UploadAttachmentsPayload, } from '../add-attachments/add-attachments.state';
import { UploadAttachments } from '../add-attachments/add-attachments.action';

import { MyHammerConfig } from '../app.module';
import { MapViewComponent } from '../map-view/map-view.component';
declare var Hammer: any;

@Component({
  selector: 'app-camn-component',
  templateUrl: './camn.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CamnComponent implements OnInit, AfterViewInit {
  SWIPE_ACTION = { UP: 'swipeup', DOWN: 'swipedown' };

  private ngUnsubscribe: Subject<void> = new Subject();

  application$: Observable<ApplicationState>;
  mapState$: Observable<DnvMapState>;
  layerState$: Observable<LayerState>;
  legendState$: Observable<DnvLegendState>;
  baseMapState$: Observable<BaseMapState>;
  dnvSearchState$: Observable<DnvSearchState>;
  headerHeight$: Observable<number>;
  mapViewState$: Observable<MapViewState>;
  lastSelectedFeature$: Observable<FeatureClickedPayload>;
  inspectionFields$: Observable<any>;

  ApplicationStatus = ApplicationStatus; // Expose the enum in the template

  currentZoomLevel: number;
  _applicationState: ApplicationState;
  _layerState: LayerState;
  _mapViewState: MapViewState;
  featurePanelOpen: boolean;
  panelHeight: number;
  featureLayers: DnvFeatureLayer[];
  excludeFeatureInfo: string[];
  selectedFeature: any;
  isDrawing: boolean;
  formError: string;
  hideFeedback = false;

  @ViewChildren('fixedHeader') fixedHeader: QueryList<ElementRef>; // ??? Is there ever more than one?
  @ViewChild('mapViewComponent') mapViewComponent: MapViewComponent;

  constructor(
    private configService: ConfigService,
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.application$ = this.store.select('application');
    this.mapState$ = this.store.select('mapState');
    this.layerState$ = this.store.select('layerState');
    this.legendState$ = this.store.select('legendState');
    this.baseMapState$ = this.store.select('baseMapState');
    this.dnvSearchState$ = this.store.select('dnvSearchState');
    this.mapViewState$ = this.store.select('mapViewState');
    this.lastSelectedFeature$ = this.store.select(getLastSelectedFeatureSelector);
    this.inspectionFields$ = this.store.select(getInspectionFieldsSelector);
  }

  ngOnInit() {
    this.mapState$.pipe(
      takeUntil(this.ngUnsubscribe)
    )
      .subscribe((state: DnvMapState) => {
        this.currentZoomLevel = state.zoomLevel;
        this.featurePanelOpen = state.expandFeaturePanel;
        this.featureLayers = state.featureLayers;
        this.excludeFeatureInfo = state.excludeFeatureInfo;
        this.selectedFeature = state.selectedFeature;
        this.isDrawing = state.isDrawing;
      });

    this.application$.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe((state: ApplicationState) => {
      this._applicationState = state;
    });

    this.layerState$.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe((state: LayerState) => {
      this._layerState = state;
    });

    this.mapViewState$.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe((state: MapViewState) => {
      this._mapViewState = state;
    });

    if (this.route.snapshot.params) {
      this.store.dispatch(new DelayedAction([new SetStateFromParams(this.route.snapshot.params)]));
    }
  }

  ngAfterViewInit() {
    // used in top padding of sidebar
    this.setHeaderHeight();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.setHeaderHeight();
  }

  setHeaderHeight() {
    if (this._applicationState.windowInnerWidth > 767) {
      if (!this.hideFeedback) {
        this.headerHeight$ = this.fixedHeader.toArray()[0].nativeElement.clientHeight;
        this.panelHeight = this._applicationState.windowInnerHeight - this.fixedHeader.toArray()[0].nativeElement.clientHeight;
      } else {
        this.headerHeight$ = this.fixedHeader.toArray()[0].nativeElement.clientHeight;
        this.panelHeight = this._applicationState.windowInnerHeight - this.fixedHeader.toArray()[0].nativeElement.clientHeight;
      }
    } else {
      this.headerHeight$ = null;
      this.panelHeight = this._applicationState.windowInnerHeight;
    }
  }

  onMapClick(coordinates: DnvMapInfo) {
    if (!this.isDrawing) {
      this.store.dispatch(new SetSurroundingFeatureList(null));
      this.store.dispatch(new SetHighlightFeature(null));
      this.store.dispatch(new SelectFeature(null));
      this.store.dispatch(new SetFeatureAttachment(null));
      this.store.dispatch(new SetInspectionAttachments(null));
      this.store.dispatch(new SetCCTVNotes({ objectId: '', galleryOptions: [], cctvData: [] }));
      this.store.dispatch(new SetSurroundingFeature(false));
      this.store.dispatch(new ToggleAlert(true));

      if (this._applicationState.lastSelectedInspection > -1) {
        this.store.dispatch(new InspectionClicked(-1));
      }

      if (this._applicationState.windowInnerWidth < 1200) {
        // if click on map in mobile and layer panel is open, close it, see enum list in application.state.ts
        if (this._applicationState.status === 5) {
          this.toggleLayer(this._applicationState.status);
          // check if filter panel is open
          const i = this._layerState.layers.filter(l => l.showFilterPanel === true);
          if (i.length > 0) {
            this.store.dispatch(new HideFilterPanel());
          }
        } else if (this._applicationState.status === 4) {
          // legend panel open
          this.toggleLegend(this._applicationState.status);
        }
      }
      if (this.featureLayers.length > 0 && !this.selectedFeature) {
        let s = '';
        this.featureLayers.forEach(layer => {
          if (layer.type.toLocaleLowerCase() !== 'raster') {
            s += layer.gisLayerNum + ` `;
          }

        });
        s = s.trim().replace(/ /g, ',');

        let whereClause = '';
        this.featureLayers.forEach(lyr => {
          if (lyr.whereClause !== '1=1') {
            whereClause += lyr.gisLayerNum + '|' + lyr.whereClause + ',';
          }
        });

        if (whereClause.length > 0) {
          whereClause = '&where=' + whereClause;
        }

        this.store.dispatch(new IdentifySurroundingFeature(`${this.configService.webApiEndpoint}identifyFeatures?latlng=`
          + coordinates.latlng.lng + `,` + coordinates.latlng.lat
          + `&northWestBound=` + coordinates.mapBounds.northWestBound.lat + `,` + coordinates.mapBounds.northWestBound.lng
          + `&southEastBound=` + coordinates.mapBounds.southEastBound.lat + `,` + coordinates.mapBounds.southEastBound.lng
          + `&imageDisplay=` + coordinates.mapSizeInPixel
          + `&layerNum=` + s
          + encodeURI(whereClause)));
      }
    }
  }

  onMoveChange(state: DnvMapState) {
    this.store.dispatch(new CenterMap({ lat: state.centerPoint.lat, lng: state.centerPoint.lng }));
    this.store.dispatch(new MapViewCheckIsDirty());
  }

  onZoomChange(state: DnvMapState) {
    this.store.dispatch(new SetZoom(state.zoomLevel));
    this.store.dispatch(new CheckLayerDisplay());
    this.store.dispatch(new MapViewCheckIsDirty());
  }

  onMapUpdate(action: DnvMapAction) {
    this.store.dispatch(action);

    switch (action.type) {
      case DnvMapActionType.AddedFeature:
      case DnvMapActionType.DeleteFeature:
      case DnvMapActionType.UpdateFeature:
      case DnvMapActionType.UpdateConversionUnit:
        this.store.dispatch(new MapViewMarkDirty());
        break;

      case DnvMapActionType.ResetSelected:
        this.store.dispatch(new SetFeatureAttachment(null));
        this.store.dispatch(new SetInspection(null));
        break;

      case DnvLayerActionType.SetInspFields:
        this.store.dispatch(new SetInspectionFields(action.payload));
        break;

      default:
        break;
    }
  }

  onLayersOrdered(event: any) {
    this.store.dispatch(event);
    this.store.dispatch(new SetMapFeatureLayers(this.layerList(event.payload)));
  }

  mapViewUpdate(event: MapViewAction) {
    this.store.dispatch(event);
  }

  addAttachmentsToSelectedFeature(event: UploadAttachmentsPayload) {
    const payload = Object.assign({}, event, {
      url: this._applicationState.lastSelectedFeature.writeUrl + // /|\
        '/' + this._applicationState.lastSelectedFeature.objectId + // 5716
        '/addAttachment',
      postUploadActions: [new FeatureClicked(this._applicationState.lastSelectedFeature)]
    });
    this.store.dispatch(new UploadAttachments(payload));
  }
  addAttachmentsToInspection(inspection: any, event: UploadAttachmentsPayload) {
    console.log(inspection);
    const featureUrlInfo: FeatureUrlInfo = lastSelectedFeatureUrlInfo(this._applicationState.lastSelectedFeature);
    if (featureUrlInfo) {
      const writeUrl = featureUrlInfo.featureDomain +
        featureUrlInfo.writeUrl +
        '/' + inspection.objectId + // 14801
        '/addAttachment';

      const getInspAttachmentPayload: GetInspAttachmentPayload = {
        url: featureUrlInfo.featureDomain +
          featureUrlInfo.url,
        objectId: inspection.objectId,
        relatedTableId: Number(featureUrlInfo.relatedTableId)
      };

      const payload = Object.assign({}, event, {
        url: writeUrl,
        postUploadActions: [new GetInspAttachment(getInspAttachmentPayload)]
      });
      this.store.dispatch(new UploadAttachments(payload));

    }
  }

  onToggleShowFilterPanel(layer: DnvLayer) {
    if (!layer.showFilterPanel) {
      const featureFilterUpdate: FeatureFilterUpdate = {
        id: layer.id,
        newFilters: layer.fieldFilters,
        whereClause: layer.whereClause,
        layer: layer
      };
      this.store.dispatch(new QueryLayerFeatureCount(featureFilterUpdate));
    }

    this.updateDownloadLink(layer);
    this.store.dispatch(new ToggleShowFilterPanel(layer));
  }
  onUpdateFilter(featureFilterUpdate: FeatureFilterUpdate) {
    this.store.dispatch(new UpdateLayerFilter(featureFilterUpdate));
    this.store.dispatch(new QueryLayerFeatureCount(featureFilterUpdate));
    this.store.dispatch(new CheckLayerDisplay());
    this.store.dispatch(new MapViewCheckIsDirty());
    this.updateDownloadLink(featureFilterUpdate.layer);
  }
  onZoomToFeatures(featureFilterUpdate: FeatureFilterUpdate) {
    this.store.dispatch(new ZoomToFeatures(featureFilterUpdate.layer.featureLayers));
  }
  downloadFeatures(featureFilterUpdate: FeatureFilterUpdate) {

  }

  onSubmit(action: any) {
    const featureUrlInfo = lastSelectedFeatureUrlInfo(action.lastSelectedFeature);
    if (featureUrlInfo) {

      const a: SaveNewInspection = new SaveNewInspection({
        lastSelectedFeature: action.lastSelectedFeature,
        formValues: action.formValues,
        modal: action.modal,
        attachment: action.formValues['Attachment'],
        featureUrlInfo: featureUrlInfo,
        writeUrl: featureUrlInfo.featureDomain + featureUrlInfo.writeUrl
      });
      this.store.dispatch(a);
    }
  }

  openMapViewDialog() {
    this.mapViewComponent.openMapViewDialog();
  }

  layerList(layerState: any) {
    const activeFeatureLayers = layerState
      .filter(l => Number(l.type) === 0) // Only keep active layers
      .filter(l => this.currentZoomLevel >= l.minZoom) // Show all layer greater than current zoom level
      .map(l => l.featureLayers);
    return activeFeatureLayers.reduce((accumulator, currentValue) => accumulator.concat(currentValue), []); // Poor man's FlatMap
  }

  toIdle(status: ApplicationStatus) {
    switch (status) {
      case ApplicationStatus.HpDrawer:
      case ApplicationStatus.Idle:
      case ApplicationStatus.Error:
        break;
      default: // Legend / Layer
        this.store.dispatch(new Idle());
        break;
    }
  }

  closeRightPanel() {
    this.store.dispatch(new SelectFeature(null));
    this.store.dispatch(new SetFeatureAttachment(null));
    this.store.dispatch(new SetInspectionAttachments(null));
    this.store.dispatch(new SetSurroundingFeatureList(null));
    this.store.dispatch(new SetHighlightFeature(null));
    this.store.dispatch(new SetSurroundingFeature(false));
    this.store.dispatch(new SetCCTVNotes({ objectId: '', galleryOptions: [], cctvData: [] }));
    this.store.dispatch(new ToggleAlert(true));
    this.store.dispatch(new InspectionClicked(-1));
    if (this.featurePanelOpen) {
      this.store.dispatch(new ToggleFeaturePanel());

    }

  }

  toggleLayer(status: ApplicationStatus) {

    if (status !== ApplicationStatus.Layer) {
      this.store.dispatch(new Layer());
    } else {
      this.toIdle(status);
    }
  }

  toggleLegend(status: ApplicationStatus) {
    this.toIdle(status);

    if (status !== ApplicationStatus.Legend) {
      this.store.dispatch(new Legend());
    }

    const activeLayers = this._layerState.layers.filter(a => a.type === 0).sort((lhs: any, rhs: any) => lhs.sequence - rhs.sequence);
    const webApiEndpoint = this.configService.webApiEndpoint;
    const emptyLegend: LegendLayer[] = [];
    this.store.dispatch(new SetLegendLayers(emptyLegend));
    activeLayers.forEach((l) => {
      // loop through feature layers to get layer id
      l.featureLayers.forEach((fl) => {
        const slash = fl.url.lastIndexOf('/');
        if (slash > -1) {
          const layerId = fl.url.substring(slash + 1, fl.url.length);
          this.store.dispatch(new LoadActiveLegendLayers(webApiEndpoint + 'legends/' + layerId));
        }
      });
    });
  }

  setActiveLayer(layer: DnvLayer) {
    this.store.dispatch(new SetActiveLayer(layer));
    this.store.dispatch(new CheckLayerDisplay());
    this.store.dispatch(new MapViewCheckIsDirty());
  }

  setAvailableLayer(layer: DnvLayer) {
    if (layer.showFilterPanel) {
      this.store.dispatch(new ToggleShowFilterPanel(layer));
    }
    this.store.dispatch(new SetAvailableLayer(layer));
    this.store.dispatch(new CheckLayerDisplay());
    this.store.dispatch(new MapViewCheckIsDirty());
  }

  toggleBasemaps() {
    this.store.dispatch(new ToggleBasemaps());
  }

  onSetBaseMap(basemap: DnvBasemap) {
    const a: DnvBasemap[] = [basemap];
    this.store.dispatch(new SetMapBasemaps(a));
    this.store.dispatch(new SetBaseMapSelected(basemap));
    this.store.dispatch(new CloseBasemaps());
  }

  searchClick(searchText: SearchItem) {
    if (searchText) {
      const searchedInfo: SearchedInfo = { searchedItem: searchText, apisUrl: `${this.configService.dnvSearchApiEndpoint}api/geoinfo` };
      this.store.dispatch(new Search(searchedInfo));
    } else {
      this.store.dispatch(new SetSelectedItem(Object.assign({}, initialSearchItem)));
      this.store.dispatch(new Search(null));
      this.store.dispatch(new SetMapGeoJsonLayers([])); // Clear the geoJson layer
    }
  }

  hideFilterPanel() {
    this.store.dispatch(new HideFilterPanel());
  }

  toggleFeaturePanel() {
    this.store.dispatch(new ToggleFeaturePanel());
  }

  panUp(event) {
    // 8 = up
    if (!this.featurePanelOpen && event.direction === 8 && (this.selectedFeature != null || this.selectedFeature)) {
      this.store.dispatch(new ToggleFeaturePanel());
    }
  }

  panDown(event) {
    // 16 = down
    // xs breakpoint, ie mobile
    if (this._applicationState.windowInnerWidth < 577) {
      if (!this.featurePanelOpen && event.direction === 16) {
        // this.store.dispatch(new SelectFeature(null));
        this.closeRightPanel();
      } else if (this.featurePanelOpen && event.direction === 16) {
        this.store.dispatch(new ToggleFeaturePanel());
        return;
      }
    }
  }

  expandPanel(id, objectId, inspType, currentObjId) {
    if (inspType && inspType === 'SANMN' && objectId !== currentObjId) {
      this.store.dispatch(new GetCCTVNotes({
        url: `${this.configService.webApiEndpoint}getCCTVRelatedDataAsync?object_Id=${objectId}`
        , objectId: objectId
      }));
    }

    $(id).on('shown.bs.collapse', function (e) {
      $('.feature-scroll').animate({
        scrollTop: $(id).offset().top - 120
      }, 1000);
    });

    if (this._applicationState.lastSelectedInspection !== objectId) {
      this.store.dispatch(new InspectionClicked(objectId));
    } else {
      // closes inspection
      this.store.dispatch(new InspectionClicked(-1));
    }
  }

  setFeatureDetails(objectId: string, url: string, writeUrl: string, allowInsp: boolean, featureId: number, assetId: string) {
    this.store.dispatch(new SetSurroundingFeature(true));
    this.store.dispatch(new GetFeatureData({
      featureUrl:
        `${this.configService.webApiEndpoint}getFeatureData?url=${url + '/' + objectId + '?f=pjson'}`, url: url
    }));
    this.store.dispatch(new SetSelectedFeatureLayer({
      url: url,
      allow_inspections: allowInsp, writeUrl: writeUrl
    }));
    this.store.dispatch(new FeatureClicked({
      url: url,
      objectId: objectId,
      writeUrl: writeUrl,
      assetId: assetId
    }));
    this.store.dispatch(new CheckInspection({
      url: url,
      objectId: objectId, excludes: this.excludeFeatureInfo,
      layerState: this._layerState.layers
    }));
    // set inspection fields
    const fields = getInspectionFields(url, this._layerState);

    this.store.dispatch(new SetInspectionFields(fields));
  }

  mouseEnter(objectId: string, featureId: number) {
    if (!this._applicationState.toggleSurroundingFeature) {
      const featureIdStr = featureId.toString();
      const matchingLayers: DnvFeatureLayer[] = this.featureLayers.filter(l => l.gisLayerNum === featureIdStr);
      if (1 === matchingLayers.length) {
        this.store.dispatch(new SetHighlightFeature({ url: matchingLayers[0].url + matchingLayers[0].whereClause, objectId: objectId }));
      }
    }
  }

  isAllowInspection() {
    // Add to this array for future layers that are allow_inspections true (db column name), but cannot add new inspection.
    const excludeAssetFromInspection: string[] = ['SANMN'];
    const asset_id: string = this.selectedFeature.filter(kv => kv[0].toLowerCase() === 'asset_id')[0][1];
    if (excludeAssetFromInspection.findIndex(item => {
      return asset_id.indexOf(item) >= 0 ? true : false;
    }) >= 0) {
      return false;
    } else {
      return true;
    }
  }

  mouseLeave() {
    if (!this._applicationState.toggleSurroundingFeature) {
      this.store.dispatch(new SetHighlightFeature(null));
    }
  }

  carouselBack() {
    this.store.dispatch(new SetHighlightFeature(null));
    this.store.dispatch(new SetSurroundingFeature(false));
    this.store.dispatch(new ToggleAlert(true));
    this.store.dispatch(new SelectFeature(null));
    this.store.dispatch(new SetCCTVNotes({ objectId: '', galleryOptions: [], cctvData: [] }));
  }

  updateDownloadLink(layer: any) {
    const layerNums: string[] = [];
    let whereClause: string;
    // tslint:disable-next-line: no-shadowed-variable
    layer.featureLayers.forEach(layer => {
      if (layer.type.toLocaleLowerCase() !== 'raster') {
        layerNums.push(layer.gisLayerNum);
      }
    });
    this.featureLayers.forEach(l => {
      if (l.url === layer.featureLayers[0].url) {
        whereClause = l.whereClause;
      }
    });

    this.store.dispatch(new SetDownloadLink(`${this.configService.webApiEndpoint}downloadFeatures?layerNums=` + layerNums
      + `&where=` + whereClause + `&featureName=` + layer.name));
  }

  retry() {
    this.store.dispatch(new ToggleAlert(true));
    this.store.dispatch(new SetExternalFeature({ message: 'Accessing Flow Works...', pending: true }));
    this.store.dispatch(new GetFlowWorksData(this._applicationState.retryContext));
  }

  closeFeedback() {
    this.hideFeedback = true;
    this.setHeaderHeight();
  }

}

// retrieves table meta data from layerState
export function getInspectionFields(url, layerState) {
  let meta = [];
  layerState.layers.forEach((layer) => {
    if (layer.tableLayers.length > 0) {
      layer.featureLayers.forEach((featureLayer) => {
        if (url.indexOf(featureLayer.url) > -1) {
          meta = layer.tableLayers[0].TableMeta;
        }
      });
    }
  });
  return meta;
}

export function getFeatureWhereClause(featureId: number, featureLayers) {
  let whereClause: string;
  featureLayers.forEach(layer => {
    if (layer.gisLayerNum === featureId.toString()) {
      whereClause = layer.whereClause;
    }
  });

  return whereClause;
}
