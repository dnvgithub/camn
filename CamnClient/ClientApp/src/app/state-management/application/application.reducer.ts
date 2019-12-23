import { ActionReducer, createSelector } from '@ngrx/store';
import { ApplicationState, initialApplicationState, ApplicationStatus } from './application.state';
import { ApplicationAction, ApplicationActionType } from './application.action';
import {
  QuestionBase, TextAreaQuestion, TextQuestion, RadioQuestion, DropdownQuestion, FileQuestion, DateQuestion,
  DnvLayerActionType
} from 'dnv-lib';
// to fix IE11 not supporting .includes()
import 'core-js/es7/array';
import 'core-js/es7/object';

function toggleThumbnails(state: ApplicationState) {
  let showThumbs = false;
  if (Number(state.selectedFeatureAttachments.images.length) === 1) {
    showThumbs = false;
  } else {
    showThumbs = true;
  }

  return [Object.assign({}, state.galleryOptions[0]
    , { thumbnails: showThumbs, 'imageArrows': showThumbs })
    , ...state.galleryOptions.slice(1)];
}

function extractInspAttributes(records: any) {
  const insp: any = [];
  let objId = 0;
  let ob: any = [];
  if (records && records.data) {
    if (records.data.relatedRecordGroups.length > 0) {
      for (let i = 0; i < records.data.relatedRecordGroups.length; i++) {
        let recordAttrs = records.data.relatedRecordGroups[i].relatedRecords;
        // sort by created date
        if (recordAttrs.length > 1) {
          recordAttrs = recordAttrs.sort(date_sort);
        }
        for (let x = 0; x < recordAttrs.length; x++) {
          const fprops = recordAttrs[x].attributes;
          const arr: Array<[string, string]> = [];
          for (const prop in fprops) {
            if (fprops.hasOwnProperty(prop)) {
              const kvPair = records.meta.filter((a: { name: string; }) => a.name === prop);
              let alias = prop;
              if (kvPair.length > 0) {
                alias = kvPair[0].alias;
              }
              if (prop.toLowerCase().indexOf('date') > -1) {
                if (fprops[prop] && fprops[prop].toString().length > 4) {
                  const convertedDate = new Date(fprops[prop]);
                  const dateString = convertedDate.toString().substring(4, convertedDate.toString().indexOf('GMT')).trim();
                  arr.push([alias, dateString]);
                } else {
                  // date value but only year
                  arr.push([alias, fprops[prop]]);
                }
              } else {
                // not date value
                if (prop.toLowerCase() === 'objectid') {
                  objId = fprops[prop];
                }
                arr.push([alias, fprops[prop]]);
              }
            }

          }
          ob = { objectId: objId, attrs: arr };
          insp.push(ob);
        }
      }
    }
  }
  return insp;
}

function getTableLayerMeta(url, layerState) {
  let meta = [];
  layerState.layers.forEach((layer) => {
    layer.featureLayers.forEach((featureLayer) => {
      if (url.indexOf(featureLayer.url) > -1) {
        meta = layer.meta;
      }
    });
  });
  return meta;
}

// sort by descending
function date_sort(a, b) {
  return new Date(b.attributes.created_date).getTime() - new Date(a.attributes.created_date).getTime();
}

function setInspAttachments(state, attachInfo) {
  let attach: any = null;
  let index;
  if (attachInfo) {
    state.selectedFeatureInspections.forEach((insp: { objectId: any; }) => {
      if (insp.objectId === attachInfo.attachData.parentID) {
        attach = insp;
        attach.attachment = attachInfo.attachData.attachment;

        // set gallery options for individual inspections
        attach.galleryOptions = state.galleryOptions;
        if (attach.attachment.length === 1) {
          attach.galleryOptions[0].thumbnails = false;
          attach.galleryOptions[0].imageArrows = false;
        } else {
          attach.galleryOptions[0].thumbnails = true;
          attach.galleryOptions[0].imageArrows = true;
        }
        index = state.selectedFeatureInspections.findIndex(a => a.objectId === attach.objectId);
      }
    });
    return [...state.selectedFeatureInspections.slice(0, index),
    Object.assign({}, state.selectedFeatureInspections[index], attach),
    ...state.selectedFeatureInspections.slice(index + 1)];
  } else {
    return state.selectedFeatureInspections;
  }
}

function convertFieldsToQuestions(fields) {
  const questionGroup: QuestionBase<any>[] = [];
  let q: QuestionBase<any>;
  if (fields && fields.length > 0) {
    fields.filter(a => a.editable).forEach(f => {

      // domain is null, text question
      if (!f.domain) {
        if (f.length < 250 && f.type === 'esriFieldTypeString') {
          // text
          q = {
            name: f.name,
            alias: f.alias,
            nullable: f.nullable,
            readonly: f.name === 'Asset_ID' ? true : false,
            value: '',
            editable: true,
            controlType: 'text',
            options: []
          };
        } else if (f.length >= 250 && f.type === 'esriFieldTypeString') {
          // textarea
          q = {
            name: f.name,
            alias: f.alias,
            nullable: f.nullable,
            readonly: false,
            value: '',
            editable: true,
            controlType: 'textarea',
            options: []
          };
        } else if (f.type === 'esriFieldTypeDate') {
          // date picker
          q = {
            name: f.name,
            alias: f.alias,
            nullable: f.nullable,
            readonly: false,
            value: '',
            editable: true,
            controlType: 'date',
            options: []
          };

        } else {
          q = {
            name: f.name,
            alias: f.alias,
            nullable: f.nullable,
            readonly: false,
            value: '',
            editable: true,
            controlType: 'text',
            options: []
          };
        }

        questionGroup.push(q);
      } else {
        // radio buttons
        if (f.domain.type === 'codedValue' && f.domain.codedValues.length === 2) {
          q = {
            name: f.name,
            alias: f.alias,
            nullable: f.nullable,
            options: f.domain.codedValues,
            value: '',
            editable: true,
            readonly: false,
            controlType: 'radio'
          };

        } else if (f.type === 'esriFieldTypeSmallInteger' && f.domain.range != null) {
          q = {
            name: f.name,
            alias: f.alias,
            nullable: f.nullable,
            options: f.domain.range,
            value: '',
            editable: true,
            readonly: false,
            controlType: 'text-range'
          };
        } else {
          // dropdown
          q = {
            name: f.name,
            alias: f.alias,
            nullable: f.nullable,
            options: f.domain.codedValues,
            value: '',
            editable: true,
            readonly: false,
            controlType: 'dropdown'
          };

        }
        questionGroup.push(q);
      }
    });
  }

  // add field for attachment
  q = {
    name: 'Attachment',
    alias: 'Attachment',
    nullable: true,
    value: '',
    editable: true,
    readonly: false,
    controlType: 'file',
    options: []
  };
  questionGroup.push(q);
  return questionGroup;
}

export function applicationReducer(
  state: ApplicationState = initialApplicationState,
  action: ApplicationAction): ApplicationState {
  switch (action.type) {
    case ApplicationActionType.Search:
      return Object.assign({}, state, {
        searchInfo: action.payload
      });

    case ApplicationActionType.HpDrawer:
      return Object.assign({}, state, {
        status: ApplicationStatus.HpDrawer,
      });

    case ApplicationActionType.ConcatSelectedFeatureSections:
      return Object.assign({}, state, {
        kvSections: [...state.kvSections, action.payload]
      });

    case ApplicationActionType.UpdateWindowSize:
      return Object.assign({}, state, {
        windowInnerHeight: action.payload.windowInnerHeight,
        windowInnerWidth: action.payload.windowInnerWidth
      });
    case ApplicationActionType.Layer:
      return Object.assign({}, state, {
        status: ApplicationStatus.Layer
      });
    case ApplicationActionType.IDLE:
      return Object.assign({}, state, {
        status: ApplicationStatus.Idle
      });
    case ApplicationActionType.SetDownloadLink:
      return Object.assign({}, state, {
        link: action.payload
      });
    case ApplicationActionType.SetCCTVInspections:
      return Object.assign({}, state, {
        selectedFeatureInspections: action.payload
      });
    case ApplicationActionType.SetCCTVNotes:
      return Object.assign({}, state, {
        cctv: {
          ...action.payload, galleryOptions: state.galleryOptions.map(s => {
            return { ...s, imageArrows: false, thumbnails: false };
          })
        }
      });
    case ApplicationActionType.SetFeatureAttachment:
      return Object.assign({}, state, {
        selectedFeatureAttachments: action.payload
      });
    case ApplicationActionType.SetExternalFeature:
      return Object.assign({}, state, {
        externalFeature: action.payload
      });
    case ApplicationActionType.ShowThumbnails:
      return Object.assign({}, state, {
        galleryOptions: toggleThumbnails(state)
      });
    case ApplicationActionType.SetInspection:
      return Object.assign({}, state, {
        selectedFeatureInspections: extractInspAttributes(action.payload)
      });
    case ApplicationActionType.SetInspectionAttachments:
      return Object.assign({}, state, {
        selectedFeatureInspections: setInspAttachments(state, action.payload)
      });

    case ApplicationActionType.SetInspectionFields:
      return Object.assign({}, state, {
        inspectionFields: convertFieldsToQuestions(action.payload)
      });
    case ApplicationActionType.SetRetryContext:
      return Object.assign({}, state, {
        retryContext: action.payload
      });
    case ApplicationActionType.SetSurroundingFeature:
      return Object.assign({}, state, {
        toggleSurroundingFeature: action.payload
      });
    case DnvLayerActionType.FeatureClicked:
      return Object.assign({}, state, {
        lastSelectedFeature: action.payload
      });
    case ApplicationActionType.SetSelectedFeatureSections:
      return Object.assign({}, state, {
        kvSections: action.payload
      });
    case ApplicationActionType.ToggleAlert:
      return Object.assign({}, state, {
        alertHidden: action.payload ? action.payload : !state.alertHidden
      });
    case ApplicationActionType.Legend:
      return Object.assign({}, state, {
        status: ApplicationStatus.Legend
      });

    case DnvLayerActionType.InspectionClicked:
      return Object.assign({}, state, {
        lastSelectedInspection: action.payload
      });

    default:
      return state;
  }
}
