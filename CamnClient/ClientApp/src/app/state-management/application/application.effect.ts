import { Injectable } from '@angular/core';
import { Store, Action } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { interval, from, Observable, of, timer, throwError } from 'rxjs';
import { debounceTime, delay, flatMap, withLatestFrom, map, switchMap, takeWhile, catchError, mergeMap, filter } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigService } from '../../services/config.service';

import { ToastrService } from 'ngx-toastr';

import {
  ApplicationActionType, Search, CheckLayerDisplay,
  SetFeatureAttachment, ShowThumbnails, ToastUserNotification,
  GetFlowWorksData, SetExternalFeature,
  SetInspection, SetInspectionAttachments, SetInspectionFields, AddFieldsToFormGroup,
  IdentifySurroundingFeature, GetFeatureData, GetAssetConditionData,
  ToggleAlert, SetRetryContext, SetSelectedFeatureSections, ConcatSelectedFeatureSections,
  GetCCTVInspection, SetCCTVInspections, GetCCTVNotes, SetCCTVNotes, DelayedAction
} from './application.action';

import {
  UserNotification, GetInspAttachmentPayload, SelectedFeatureInspection,
  FeatureUrlInfo, lastSelectedFeatureUrlInfo, KVSection, InspectionStruct
} from './application.state';

import { SearchService } from '../../services/search.service';

import { ApplicationService } from '../../services/application.service';

import { AppState } from '../../app.component';

import { getInspectionFields, getFeatureWhereClause } from '../../camn/camn.component';

import { UploadAttachmentsPayload } from '../../add-attachments/add-attachments.state';
import { UploadAttachments } from '../../add-attachments/add-attachments.action';

import {
  SetMapBasemaps, SetMapFeatureLayers, SetAvailableLayer, SetActiveLayer
  , SetZoom, SetMapGeoJsonLayers, ZoomToGeoJsonLayer,
  LayerState, DnvMapActionType, FitBounds,
  ZoomToFeatures, FeatureClicked, DnvLayerActionType,
  ConcatAdditionalFeature, GetInspection, CheckInspection,
  GetInspAttachment, SelectFeature, SetFeatureTable,
  ToggleFeaturePanel, SetSurroundingFeatureList,
  DnvBaseMapActionType, SetSelectedFeatureLayer, SetHighlightFeature,
  DnvFeatureLayer, InspectionClicked
} from 'dnv-lib';


function getFeatureLayerMeta(url, state) {
  let meta = [];
  state.layers.forEach((layer) => {
    layer.featureLayers.forEach((featureLayer) => {
      const urlMap = url.substring(url.indexOf('MapServer'), url.length);
      const flMap = featureLayer.url.substring(featureLayer.url.indexOf('MapServer'), featureLayer.url.length);
      if (urlMap === flMap) {
        meta = layer.meta;
      }
    });
  });
  return meta;
}

function getTableMeta(url, state) {
  let tblMeta = [];
  state.layers.forEach(layer => {
    layer.featureLayers.forEach(fl => {
      if (fl.url === url) {
        tblMeta = layer.tableLayers[0].TableMeta;
      }
    });
  });

  return tblMeta;
}

function getArrayValue(key: string, arrays: Array<[string, string]>) {
  let value: string;
  if (arrays) {
    arrays.forEach(array => {
      if (array[0] === key) {
        value = array[1];
      }
    });
  }
  return value;
}

function formatDate(key: string, value: string) {
  // format date to readable string
  if (key.toLowerCase().indexOf('date') > -1 && value.length > 4) {
    const convertedDate = new Date(Number(value));
    if (convertedDate.toString().toLowerCase().indexOf('invalid') === -1) {
      value = convertedDate.toString().substring(4, convertedDate.toString().indexOf('GMT')).trim();
    }
  }

  return value;
}

@Injectable()
export class ApplicationEffects {

  @Effect() search$: Observable<Action> = this.actions$.pipe(
    ofType(ApplicationActionType.Search),
    debounceTime(200), // Prevent successive search actions from hitting the server.
    filter((action: Search) => {
      if (!action.payload) {
        return false; // payload is null
      } else {
        // there must be something to search for
        return (action.payload.searchedItem.assetId || action.payload.searchedItem.name).length > 0;
      }
    }),
    switchMap((action: Search) => this.searchService.getGeoInfo(action.payload)
      .pipe(

        flatMap((data: any) => {
          const url = new Date().toISOString(); // create a unique url for each search result
          return [
            new SetMapGeoJsonLayers([
              {
                url: url,
                json: data
              }
            ]),
            new ZoomToGeoJsonLayer(url)
          ];
        }
        )
      )
    )
  );

  @Effect() getFeatureData$ = this.actions$.pipe(
    ofType(ApplicationActionType.GetFeatureData),
    withLatestFrom(this.store$),
    switchMap(([action, storeState]) =>
      this.appService.getGisFeatureData((action as any).payload.featureUrl).pipe(
        catchError((error) =>
          // tslint:disable-next-line: deprecation
          of({ error })
        ),
        map((data: any) => ({ data: data, url: (action as any).payload.url, layerState: storeState.layerState }))
      )
    )
    ,
    flatMap((data: any) => {
      if (data.data.error) {
        return [
          new ToastUserNotification({
            type: 'error',
            title: data.error.name,
            message: data.error.message,
            options: {
              disableTimeOut: true,
              closeButton: true
            }
          }),
          new ToggleFeaturePanel()
        ];
      } else {
        // replace label with alias
        const metaDictionary = getFeatureLayerMeta(data.url, data.layerState);
        let lookupField = {};
        const generalInfo: Array<[string, string]> = [];
        const assetInfo: Array<[string, string]> = [];

        for (let i = 0; i < data.data.length; i++) {
          const keyVal = data.data[i];
          lookupField = metaDictionary.filter(a => a.name === keyVal[0]);
          if (lookupField[0]) {
            if (lookupField[0].name.includes('AM_') || lookupField[0].name.includes('Asset')) {
              assetInfo.push([lookupField[0].alias, formatDate(lookupField[0].alias, keyVal[1])]);
            } else {
              generalInfo.push([lookupField[0].alias, formatDate(lookupField[0].alias, keyVal[1])]);
            }
          }
        }

        if (generalInfo.length > 0 && assetInfo.length === 0) {
          let fw: string = null;
          generalInfo.forEach(attr => {
            if (attr[0] === 'Station ID') {
              fw = attr[1];
            }
          });
          return [
            new ToggleAlert(true),
            new SelectFeature(data.data),
            new SetSelectedFeatureSections([{
              title: 'General Information', kvPair: generalInfo.sort((first, second) => (first[0]
                > second[0] ? 1 : -1))
            }]),
            new SetExternalFeature({ message: 'Accessing Flow Works...', pending: true }),
            new GetFlowWorksData(`${this.configService.webApiEndpoint}flowworks/getFlowWorksData?stationId=` + fw)
          ];
        } else if (generalInfo.length > 0 && assetInfo.length > 0) {
          const assetId = assetInfo.filter(attr =>
            attr[0] === 'Asset ID'
          );
          return [
            new SelectFeature(data.data),
            new SetSelectedFeatureSections([{
              title: 'General Information', kvPair: generalInfo.sort((first, second) => (first[0]
                > second[0] ? 1 : -1))
            }]),
            new ConcatSelectedFeatureSections({
              title: 'Asset Information', kvPair: assetInfo.sort((first, second) => (first[0]
                > second[0] ? 1 : -1))
            }),
            new GetCCTVInspection(`${this.configService.webApiEndpoint}getCCTVDataAsync?asset_Id=` + assetId[0][1])
          ];
        }
      }
    })
  );

  @Effect() getCCTVInspection$ = this.actions$.pipe(
    ofType(ApplicationActionType.GetCCTVInspection),
    switchMap((action: GetCCTVInspection) =>
      this.appService.getFlowWorksData(action.payload).pipe(
        // tslint:disable-next-line: deprecation
        catchError(() => of([])),
      )
    )
    ,
    flatMap((inspections: { [objectId: string]: Array<[string, string]> }) => {
      if (Object.keys(inspections).length > 0) {
        const inspFeature: SelectedFeatureInspection[] = [];
        const mediaType = 'videos';
        for (const inspection in inspections) {
          if (inspections.hasOwnProperty(inspection)) {
            const insp = {} as SelectedFeatureInspection;
            insp.objectId = inspection;
            insp.attrs = inspections[inspection].map(kv => [kv[0].replace('Date', 'Created Date').replace('_', ' ')
              , kv[1] = formatDate(kv[0], kv[1])]).filter(kv => kv[1] !== null && kv[1] !== '')
              .sort((a, b) => a[0] > b[0] ? 1 : -1) as Array<[string, string]>;
            insp.galleryOptions = [];
            insp.attachment = [];
            insp.inspType = 'SANMN';
            if (inspections[inspection].filter(kv => kv[0] === 'EXTENSION')[0][1]) {
              insp.video = `${this.configService.cctvMediaService}${mediaType}/CCTV Inspections/`
                + inspections[inspection].filter(kv => kv[0] === 'JOBNUMBER')[0][1] + '.'
                + inspections[inspection].filter(kv => kv[0] === 'EXTENSION')[0][1];
            } else {
              insp.video = null;
            }
            inspFeature.push(insp);
          }
        }

        if (Object.keys(inspections).length === 1) {
          return [
            new SetCCTVInspections(inspFeature.sort((a, b) => Date.parse(a.attrs.filter(kv => kv[0] === 'Created Date')[0][1])
              > Date.parse(b.attrs.filter(kv => kv[0] === 'Created Date')[0][1]) ? -1 : 1)),
            new GetCCTVNotes({
              url: `${this.configService.webApiEndpoint}getCCTVRelatedDataAsync?object_Id=${inspFeature[0].objectId}`
              , objectId: inspFeature[0].objectId
            }),
            new InspectionClicked(inspFeature[0].objectId)
          ];
        } else {
          return [
            new SetCCTVInspections(inspFeature.sort((a, b) => Date.parse(a.attrs.filter(kv => kv[0] === 'Created Date')[0][1])
              > Date.parse(b.attrs.filter(kv => kv[0] === 'Created Date')[0][1]) ? -1 : 1))
          ];
        }
      }

      return [];
    })
  );

  @Effect() getCCTVNotes$ = this.actions$.pipe(
    ofType(ApplicationActionType.GetCCTVNotes),
    switchMap((action: GetCCTVNotes) =>
      this.appService.getFlowWorksData(action.payload.url).pipe(
        // tslint:disable-next-line: deprecation
        catchError(() => of([])),
        map((data) => ({ inspectionNotes: data, payload: action.payload.objectId }))
      ),
    )
    ,
    flatMap((data: any) => {
      if (data.inspectionNotes) {
        const inspNotes: {
          objectId: string, galleryOptions: any, cctvData: {
            title: string, kvPair: Array<[string, string]>,
            img: { small: string, medium: string, big: string }[]
          }[]
        } = { objectId: '', galleryOptions: [], cctvData: [] };
        const mediaType = 'photos';
        for (const inspection in data.inspectionNotes) {
          if (data.inspectionNotes.hasOwnProperty(inspection)) {
            const kv = {} as { title: string, kvPair: Array<[string, string]>, img: { small: string, medium: string, big: string }[] };
            kv.title = inspection;
            // tslint:disable-next-line: no-shadowed-variable
            kv.kvPair = data.inspectionNotes[inspection].filter((kv: any[]) => kv[1]).sort((a, b) => a[0] > b[0] ? 1 : -1);
            // tslint:disable-next-line: no-shadowed-variable
            kv.img = [{
              // tslint:disable-next-line: no-shadowed-variable
              small: data.inspectionNotes[inspection].filter((kv: string[]) => kv[0] === 'PHOTOGRAPHNUMBER')[0][1]
              , medium: '', big: ''
            }];
            inspNotes.objectId = data.payload;
            inspNotes.cctvData.push(kv);
          }
        }

        inspNotes.cctvData = inspNotes.cctvData.sort((a, b) => a.kvPair.filter(kv => kv[0] === 'DISTANCE')[0][1]
          > b.kvPair.filter(kv => kv[0] === 'DISTANCE')[0][1] ? 1 : -1)
          .map((obj, index) => {
            const img = obj.img[0].small;
            obj.title = 'Note ' + (index + 1);
            if (img) {
              obj.img = [{
                small: `${this.configService.cctvMediaService}${mediaType}/CCTV Inspections/`
                  + obj.kvPair.filter(kv => kv[0] === 'JOBNUMBER')[0][1] + '_0' + img + '.jpg'
                , medium: `${this.configService.cctvMediaService}${mediaType}/CCTV Inspections/`
                  + obj.kvPair.filter(kv => kv[0] === 'JOBNUMBER')[0][1] + '_0' + img + '.jpg'
                , big: `${this.configService.cctvMediaService}${mediaType}/CCTV Inspections/`
                  + obj.kvPair.filter(kv => kv[0] === 'JOBNUMBER')[0][1] + '_0' + img + '.jpg'
              }];
            } else {
              obj.img = [];
            }
            return obj;
          });

        return [new SetCCTVNotes(inspNotes)];
      }
    })
  );

  @Effect() getFlowWorksData$ = this.actions$.pipe(
    ofType(ApplicationActionType.GetFlowWorksData),
    switchMap((action: GetFlowWorksData) =>
      this.appService.getFlowWorksData(action.payload).pipe(
        // tslint:disable-next-line: deprecation
        catchError(() => of([])),
        map((data) => ({ data: data, payload: action.payload }))
      )
    )
    ,
    flatMap((fw: any) => {
      if (fw.data.length > 0) {
        return [
          new SetExternalFeature({ message: '', pending: false }),
          new ConcatSelectedFeatureSections({ title: 'FlowWorks Information', kvPair: fw.data })
        ];
      } else {
        return [
          new SetExternalFeature({ message: '', pending: false }),
          new ToggleAlert(),
          new SetRetryContext(fw.payload)
        ];
      }

    })
  );

  @Effect() getAssetConditionData$ = this.actions$.pipe(
    ofType(DnvMapActionType.SelectFeature),
    withLatestFrom(this.store$),
    switchMap(([action, storeState]) =>
      this.appService.getFlowWorksData(`${this.configService.webApiEndpoint}jde/getassetconditiondata?assetid=`
        + getArrayValue('Asset_Id', storeState.mapState.selectedFeature)).pipe(
          // tslint:disable-next-line: deprecation
          catchError(() => of([])),
          map((data) => data))
    ),
    flatMap((data: any) => {
      if (data) {
        return [new ConcatSelectedFeatureSections({ title: 'Asset Condition', kvPair: data })];
      } else {
        return [];
      }
    })
  );


  @Effect() checkLayerDisplayEffect$ = this.actions$.pipe(
    ofType(ApplicationActionType.CheckLayerDisplay),
    withLatestFrom(this.store$),
    map(([, store]) => {
      return this.layerList(store.mapState.zoomLevel, store.layerState);
    }),
    flatMap((layers) => [
      new SetMapFeatureLayers(layers)
    ])
  );

  // ZoomToFeatures - After zooming to features, the zoom level might have changed.
  // Trigger the check to determine which layer needs to be shown
  @Effect() zoomToFeaturesEffect$ = this.actions$.pipe(
    ofType(DnvMapActionType.FitBounds),
    withLatestFrom(this.store$),
    map(([action, store]) => {
      if ((action as FitBounds).payload) { // The first FitBounds contain boundaries, don't do anything at that time
        return [];
      } else {
        const actions = [];

        actions.push(new CheckLayerDisplay()); // A second FitBounds always follow with a null payload; check the layer display at this time
        return actions;
      }
    }),
    delay(0), // Removing this delay results in layers displaying incorrectly after the zoomToFeature
    // The problem might be with the dnv-map updateMapState logic or due to the asyn nature of displaying the map
    flatMap((actions) => actions)
  );


  // check if layer has attachments first and then tries to get them
  @Effect() featureClicked$: Observable<any> = this.actions$.pipe(
    ofType(DnvLayerActionType.FeatureClicked),
    switchMap(
      (action: FeatureClicked): any => this.httpClient.get(
        action.payload.url + '?f=pjson').pipe(
          // tslint:disable-next-line: deprecation
          catchError(() => of([])),
          mergeMap((data: any) => {
            if (data.hasAttachments) {
              return this.httpClient.get(
                action.payload.url + '/'
                + action.payload.objectId
                + `/attachments?f=pjson`
              ).pipe(
                // tslint:disable-next-line: deprecation
                catchError(() => of([])),
                // tslint:disable-next-line: no-shadowed-variable
                map(data => {
                  return ({ url: action.payload.url, data: data, objId: action.payload.objectId });
                }),
                // tslint:disable-next-line: no-shadowed-variable
                map((data: any) => this.extractAttachments(data.url, data.data, data.objId)),
                flatMap((urls: any) => {
                  if (urls.images && urls.images.length > 0) {
                    return [
                      new SetFeatureAttachment(urls),
                      new ShowThumbnails()
                    ];
                  } else if (urls.images && urls.images.length === 0) {
                    return [
                      new SetFeatureAttachment(null)
                    ];
                  } else {
                    return [new ToastUserNotification({
                      type: 'error',
                      title: 'Can\'t get attachment',
                      message: 'Can\'t get attachment',
                      options: {
                        disableTimeOut: true,
                        closeButton: true
                      }
                    })];
                  }
                })
              );
            } else {
              if (data.error) {
                return [new ToastUserNotification({
                  type: 'error',
                  title: 'Can\'t get attachment',
                  message: 'Can\'t get attachment',
                  options: {
                    disableTimeOut: true,
                    closeButton: true
                  }
                })];
              }
              return [];
            }
          })
        )

    )
  );

  @Effect({ dispatch: false }) toastUserNotification$ = this.actions$.pipe( // { dispatch: false }
    ofType(ApplicationActionType.ToastUserNotification),
    map((action: ToastUserNotification) => {
      const notification: UserNotification = action.payload;
      if (notification) {
        switch (notification.type) {
          case 'success':
            this.toastr.success(notification.message, notification.title, notification.options || {});

            break;
          case 'info':
            this.toastr.info(notification.message, notification.title, notification.options || {});

            break;
          case 'warning':
            this.toastr.warning(notification.message, notification.title, notification.options || {});

            break;

          case 'error':
            this.toastr.error(notification.message, notification.title, notification.options || {});

            break;
          default:
            this.toastr.error(
              notification.message || 'Please raise a suport ticket with information about what you were doing in the application!'
              , notification.title || 'Something went wrong...', notification.options || {});
            break;
        }
      } else {
        this.toastr.error(
          'Please raise a suport ticket with information about what you were doing in the application!',
          'Something went wrong...', {});
      }
    })
  );

  // Check if there are inspections
  @Effect() checkInspection$: Observable<any> = this.actions$.pipe(
    ofType(DnvLayerActionType.CheckInspection),
    withLatestFrom(this.store$),
    switchMap(
      ([action, store]: [CheckInspection, any]): any => this.httpClient.get(
        action.payload.url + '?f=pjson'
      ).pipe(
        // tslint:disable-next-line: deprecation
        catchError(() => of([])),
        map(data => {
          return ({ json: data, oid: action.payload.objectId, url: action.payload.url, layerState: store.layerState }); // TODO layerState
        }
        ),
        switchMap((data: any) => {
          if (data.json && (data.json.error || data.json.length === 0)) {
            return [data.json.error];
          }
          return this.getInspections(data.json, data.oid, data.url, action.payload.excludes, data.layerState);

        })
      )
    ),
    flatMap((res: any) => {
      const actionArr: Action[] = [];
      if (res && res.data && res.data.relatedRecordGroups) {
        actionArr.push(new SetInspection(res));
        // if there is only one inspection, set lastSelectedInspection to object ID of inspection
        if (res.data.relatedRecordGroups.length > 0) {
          if (res.data.relatedRecordGroups[0].relatedRecords.length === 1) {
            const inspObjId = res.data.relatedRecordGroups[0].relatedRecords[0].attributes.OBJECTID;
            actionArr.push(new InspectionClicked(inspObjId));
          }
        }


        if (res.data.relatedRecordGroups.length > 0) {
          for (let i = 0; i < res.data.relatedRecordGroups[0].relatedRecords.length; i++) {
            const rec = res.data.relatedRecordGroups[0].relatedRecords[i];
            const getInspAttachmentPayload: GetInspAttachmentPayload = {
              url: res.data.url,
              objectId: rec.attributes.OBJECTID,
              relatedTableId: res.data.relatedTableId
            };
            actionArr.push(new GetInspAttachment(getInspAttachmentPayload));
          }
        }
        return actionArr;
      } else if (res && res.length === 0) {
        return [new SetInspection([])];
      } else {
        const errorMsg = res.message ? res.message : res.data && res.data.message ? res.data.message : 'error';
        return [new ToastUserNotification({
          type: 'error',
          title: 'Can\'t get inspection',
          message: errorMsg,
          options: {
            disableTimeOut: true,
            closeButton: true
          }
        })];
      }

    })

  );

  @Effect() getInspAttachment$: Observable<any> = this.actions$.pipe(
    ofType(DnvLayerActionType.GetInspAttachment),
    flatMap((action: GetInspAttachment): any => {
      return this.extractInspAttachments(action.payload.url, action.payload.objectId, action.payload.relatedTableId)
        .pipe(
          // tslint:disable-next-line: deprecation
          catchError(() => of([])),
          flatMap((data: any) => {
            if (!data.message) {
              return [new SetInspectionAttachments(data)];
            } else {
              return [
                new ToastUserNotification({
                  type: 'error',
                  title: 'Inspection Attachment Errors',
                  message: data.message,
                  options: {
                    disableTimeOut: true,
                    closeButton: true
                  }
                })
              ];
            }

          })
        );
    })
  );

  @Effect() identifySurroundingFeature$ = this.actions$.pipe(
    ofType(ApplicationActionType.IdentifySurroundingFeature),
    withLatestFrom(this.store$),
    switchMap(([action, storeState]) =>
      this.appService.identifySurroundingFeature((action as any).payload).pipe(
        catchError((error) =>
          // tslint:disable-next-line: deprecation
          of({ error })
        ),
        map((data) => ({ data: data, layerState: storeState.layerState, mapState: storeState.mapState }))
      )
    )
    ,
    flatMap((data: any) => {
      if (data.data.error) {
        return [
          new ToastUserNotification({
            type: 'error',
            title: data.data.error.statusText,
            message: data.data.error.message,
            options: {
              disableTimeOut: true,
              closeButton: true
            }
          })
        ];
      } else if (data.data.length === 1) {
        // The assumption here is that the name of the feature corresponds to the name of a single layer.
        const fields = getInspectionFields(data.data[0].url, data.layerState);
        const layerName = data.data[0].name;
        const arrayOfTableLayers = data.layerState.layers
          .filter((l: { name: any; }) => l.name === layerName)
          .map((l: { tableLayers: any; }) => l.tableLayers);
        const tableLayers = this.myFlatMap(arrayOfTableLayers);


        return [
          new SetSurroundingFeatureList(null),
          new GetFeatureData({
            featureUrl: `${this.configService.webApiEndpoint}getFeatureData?url=${data.data[0].url + '/'
              + data.data[0].objectId + '?f=pjson'}`, url: data.data[0].url
          }),
          new SetSelectedFeatureLayer({
            url: data.data[0].url,
            writeUrl: data.data[0].writeUrl,
            allow_inspections: data.data[0].allowInsp,
            inspEndPoint: data.data[0].inspEndPoint
          }),
          new FeatureClicked({
            url: data.data[0].url,
            writeUrl: data.data[0].writeUrl,
            objectId: data.data[0].objectId,
            tableLayers: tableLayers,
            assetId: data.data[0].assetId,
            excludeFeatureInfo: data.mapState.excludeFeatureInfo
          }),
          new CheckInspection({
            url: data.data[0].url,
            objectId: data.data[0].objectId, excludes: '' // <- TODO check the excludes list -> data.mapState.excludeFeatureInfo ???
          }),
          new SetInspectionFields(fields),
          new SetHighlightFeature(
            {
              url: data.data[0].url + getFeatureWhereClause(data.data[0].featureId, data.mapState.featureLayers),
              objectId: data.data[0].objectId
            }
          )
        ];
      } else if (data.data.length < 1) {
        return [
          new SetSurroundingFeatureList(null)
        ];
      } else {
        return [
          new SetSurroundingFeatureList(data.data)
        ];
      }
    })
  );

  @Effect() saveInspectionEffect$ = this.actions$.pipe(
    ofType(ApplicationActionType.SaveNewInspection),
    switchMap((action: any): any => {

      const headers = new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      });
      const body = this.createJson(action.payload.formValues);
      // get /addFeatures url
      return this.httpClient.post(action.payload.writeUrl + '/addFeatures', body, { headers: headers })
        .pipe(
          // tslint:disable-next-line: deprecation
          catchError(() => of([])),
          map(data => ({ lastSelectedFeature: action.payload.lastSelectedFeature, data: data })),
          flatMap((response: any) => {

            if (response.data && response.data.error) {
              return [
                new ToastUserNotification({
                  type: 'error',
                  title: 'Cannot save inspection',
                  message: 'There was a problem saving the inspection',
                  options: {
                    disableTimeOut: true,
                    closeButton: true
                  }
                })
              ];
            } else {
              // Extract the objectId of the newly created inspection
              let inspectionObjectId = '';
              if (response.data && response.data.addResults && (1 === response.data.addResults.length)) {
                inspectionObjectId = response.data.addResults[0].objectId;
              }
              const actions: Action[] = [];
              // if attachments were specificied, attach them now
              if (action.payload.attachment) {

                const featureUrlInfo: FeatureUrlInfo = lastSelectedFeatureUrlInfo(action.payload.lastSelectedFeature);
                if (featureUrlInfo) {
                  const writeUrl = featureUrlInfo.featureDomain +
                    featureUrlInfo.writeUrl +
                    '/' + inspectionObjectId + // 14801
                    '/addAttachment';

                  const getInspAttachmentPayload: GetInspAttachmentPayload = {
                    url: featureUrlInfo.featureDomain +
                      featureUrlInfo.url,
                    objectId: Number(inspectionObjectId),
                    relatedTableId: Number(featureUrlInfo.relatedTableId)
                  };

                  const payload: UploadAttachmentsPayload = {
                    url: writeUrl,
                    files: action.payload.attachment,
                    modal: action.payload.modal,
                    postUploadActions: [new GetInspAttachment(getInspAttachmentPayload)]
                  };

                  actions.push(new UploadAttachments(payload));
                }
              }

              actions.push(
                new InspectionClicked(inspectionObjectId)
              );

              actions.push(
                new CheckInspection({
                  url: response.lastSelectedFeature.url,
                  objectId: response.lastSelectedFeature.objectId, excludes:
                    response.lastSelectedFeature.excludeFeatureInfo
                })
              );

              // reverse the order of actions so that we check
              // the new inspection and click it before uploading the attachments
              return actions.reverse();
            }

          })
        );
    }),
  );



  @Effect() DelayedAction$ = this.actions$.pipe(
    ofType(ApplicationActionType.DelayedAction),
    delay(0),
    flatMap((action: DelayedAction) => {
      return action.payload;
    })
  );

  private createJson(values) {
    let dateCorrected = '';
    if (values.DateCorrected) {
      dateCorrected = values.DateCorrected.year + '-' + values.DateCorrected.month + '-' + values.DateCorrected.day;
      const today = new Date();
      const currentTime = today.getUTCHours() + ':' + today.getUTCMinutes() + ':' + today.getUTCSeconds();
      dateCorrected = dateCorrected + ' ' + currentTime;
    }
    let valueString = '';
    for (const key in values) {
      if (values.hasOwnProperty(key)) {
        if (key.toLowerCase() !== 'attachment' && key.toLowerCase() !== 'datecorrected') {
          if (values[key] !== null) {
            valueString = valueString + '"' + key + '":"' + values[key] + '",';
          }
        } else if (key.toLowerCase() === 'datecorrected') {
          if (dateCorrected.length > 0) {
            valueString = valueString + '"' + key + '":"' + dateCorrected + '",';
          }
        }
      }
    }

    valueString = '[{"attributes": {' + valueString + '}}]';

    const queryString = 'f=pjson&rollbackOnFailure=true&features=' + encodeURIComponent(valueString);
    return queryString;
  }


  // [[1,2],[3,4]] -> [1, 2, 3, 4]
  myFlatMap(list: any[]) {
    return list.reduce((accumulator, currentValue) => accumulator.concat(currentValue), []); // Poor man's FlatMap
  }

  layerList(zoomLevel: number, layerState: LayerState) {
    const activeFeatureLayers = layerState.layers
      .filter(l => l.type === 0) // Only keep active layers
      .filter(l => zoomLevel >= l.minZoom) // Only keep an active layer if the zoom level is high enough
      .map(l => l.featureLayers);
    return this.myFlatMap(activeFeatureLayers);
  }

  private extractAttachments(url: any, attachments: any, objectId: any) {
    const urls: any = { images: [], others: [] };
    if (attachments && attachments.attachmentInfos) {
      attachments.attachmentInfos.forEach(item => {
        const fileUrl = url + '/' + objectId + '/attachments/' + item.id;
        if (item.contentType.indexOf('image') > -1) {
          urls.images.push({ small: fileUrl, medium: fileUrl, big: fileUrl });
        } else {
          urls.others.push({ url: fileUrl, size: item.size, id: item.id, name: item.name });
        }
      });
      return urls;
    }
    return [];

  }

  private getInspections(data, objId, url, excludes, layerState) {
    if (data.relationships && data.relationships.length > 0) {
      const relationId = data.relationships[0].id;
      const relTableId = data.relationships[0].relatedTableId;
      const queryUrl = url + '/queryRelatedRecords?objectIds=' + objId + '&relationshipid=' + relationId + '&outFields=*&f=pjson';
      return this.httpClient.get(queryUrl)
        .pipe(
          // tslint:disable-next-line: deprecation
          catchError(() => of([])),
          // tslint:disable-next-line: no-shadowed-variable
          map((data: InspectionStruct) => {
            console.log(data);
            data.relatedTableId = relTableId;
            data.url = url;
            const meta = getTableMeta(url, layerState);
            if (data.error) {
              return { data: data.error, excludes };
            }
            return { data, excludes, meta };
          })
        );
    }
    return [];
  }

  private extractInspAttachments(url: string, objectId: number, tblId) {
    const serverUrl: string = url.substring(0, url.lastIndexOf('/'));
    return this.httpClient.get(
      serverUrl + '/' + tblId + '/' + objectId + '/attachments?f=pjson'
    ).pipe(
      // tslint:disable-next-line: deprecation
      catchError(() => of([])),
      map((attachData: any) => {

        attachData.parentID = objectId;
        attachData.attachment = [];
        if (attachData.attachmentInfos) {
          for (let i = 0; i < attachData.attachmentInfos.length; i++) {
            const imgUrl = serverUrl + '/' + tblId + '/' + attachData.parentID + '/attachments/' + attachData.attachmentInfos[i].id;
            attachData.attachment.push({ small: imgUrl, medium: imgUrl, big: imgUrl });
          }
          return { attachData };
        } else {
          return { message: 'Can\'t get inspection attachments' };
        }
      })
    );
  }


  private getInspTblId(jsonObj, url) {
    // find table id by matching table name
    let tblId = 0;
    if (jsonObj.tables && jsonObj.tables.length > 0) {
      jsonObj.tables.forEach((tbl: { name: string | string[]; id: number; }) => {
        // match table name
        if (tbl.name.indexOf('Insp') > -1) {
          tblId = tbl.id;
        }
      });
    }
    return [{ tblId: tblId, url: url }];
  }


  constructor(
    private toastr: ToastrService,
    private searchService: SearchService,
    private actions$: Actions,
    private store$: Store<AppState>,
    private httpClient: HttpClient,
    private appService: ApplicationService,
    private configService: ConfigService
  ) { }

}
