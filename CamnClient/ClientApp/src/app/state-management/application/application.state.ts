import { createFeatureSelector, createSelector } from '@ngrx/store';
import { NgxGalleryOptions, NgxGalleryAnimation } from 'ngx-gallery';
import { FeatureClickedPayload } from 'dnv-lib';

export enum ApplicationStatus {
  Error,
  Live,
  HpDrawer,
  Playback,
  Legend,
  Layer,
  Idle
}

export interface ExternalFeatureType {
  message: string;
  pending: boolean;
}

export interface KVSection {
  title: string;
  kvPair: Array<[string, string]>;
}

export interface SelectedFeatureInspection {
  objectId: string;
  attrs: Array<[string, string]>;
  galleryOptions: any;
  attachment: any;
  inspType: string;
  video: string;
}

export interface ApplicationState {
  status: ApplicationStatus;
  windowInnerHeight: number;
  windowInnerWidth: number;
  galleryOptions: NgxGalleryOptions[];
  selectedFeatureAttachments: AttachmentState;
  externalFeature: ExternalFeatureType;
  selectedFeatureInspections: SelectedFeatureInspection[];
  inspectionFields: any;
  lastSelectedFeature: FeatureClickedPayload;
  toggleSurroundingFeature: boolean;
  link: string;
  alertHidden: boolean;
  retryContext: any;
  kvSections: KVSection[];
  cctv: {
    objectId: string, galleryOptions: any, cctvData: {
      title: string, kvPair: Array<[string, string]>
        , img: { small: string, medium: string, big: string }[]
    }[]
  };
  lastSelectedInspection: number;
}

export interface AttachmentState {
  images: any;
  others: any;
}

export const initialApplicationState: ApplicationState = {
  status: ApplicationStatus.Live,
  windowInnerHeight: window.innerHeight,
  windowInnerWidth: window.innerWidth,
  galleryOptions: [
    {
      width: '340px',
      thumbnailsColumns: 4,
      imageAnimation: NgxGalleryAnimation.Slide,
      thumbnailsMoveSize: 4,
      previewCloseOnEsc: true,
      thumbnails: false,
      imageArrows: true
    },

    // max-width 800
    {
      breakpoint: 800,
      width: '100%',
      imagePercent: 80,
      thumbnailsPercent: 20,
      thumbnailsMargin: 20,
      thumbnailMargin: 20
    },
    // max-width 576 bootstrap 'xs'
    {
      breakpoint: 576,
      imagePercent: 100,
      thumbnailsPercent: 20,
      thumbnailsMargin: 10,
      thumbnailMargin: 10
    }
  ],
  selectedFeatureAttachments: {
    images: [],
    others: []
  },
  externalFeature: { message: '', pending: false },
  selectedFeatureInspections: [],
  inspectionFields: [],
  lastSelectedFeature: null,
  toggleSurroundingFeature: false,
  link: '',
  alertHidden: true,
  retryContext: null,
  kvSections: [],
  cctv: { objectId: '', galleryOptions: [], cctvData: [] },
  lastSelectedInspection: -1
};

export interface UserNotification {
  type: string; // One of: 'success', 'error', 'info', 'warning'
  title: string;
  message: string;
  options: { [id: string]: any };
}

export interface GetInspAttachmentPayload {
  url: string;
  objectId: number;
  relatedTableId: number;
}


export const getLastSelectedFeatureSelector = createSelector(
  createFeatureSelector<ApplicationState>('application'),
  (state: ApplicationState) => state.lastSelectedFeature
);
export const getInspectionFieldsSelector = createSelector(
  createFeatureSelector<ApplicationState>('application'),
  (state: ApplicationState) => state.inspectionFields
);

export interface FeatureUrlInfo {
  featureDomain: string;
  url: string;
  writeUrl: string;
  relatedTableId: string;
}

export interface InspectionStruct {
  fields: InspectionFields[];
  relatedRecordGroups: {
    objectId: number;
    relatedRecords: Inspection[];
  };
  relatedTableId: number;
  url: string;
  error?: string;
}

export interface InspectionFields {
  name: string;
  type: string;
  alias: string;
}

export interface Inspection {
  attributes: {
    OBJECTID: number;
    Asset_ID: string;
    CahnnelCond: string;
    RackCond: string;
    VegCond: string;
    RailCond: string;
    MasonryCond: string;
    InspComments: string;
    DateCorrected: Date;
    created_user: string;
    created_date: Date;
    last_edited_user: string;
    last_edited_date: Date;
    Inspector: string;
    HazCorrected: string;
    Priority: number;
  };
}

export function lastSelectedFeatureUrlInfo(feature: FeatureClickedPayload): FeatureUrlInfo {

  let info = null;

  if (feature.tableLayers) {
    // There could be many tables attached to a layer.
    // For now, assume only an inspection table would have a WriteUrl
    const tableLayers: any = feature.tableLayers
      .filter(l => l.WriteUrl && l.WriteUrl.length);

    if (tableLayers.length === 1) {
      info = {
        featureDomain: '',
        url: '',
        writeUrl: '',
        relatedTableId: ''
      };

      // https://geotoolsprod.cdnv.dnv.ca:6443/arcgis/rest/services/Data_CAMN_v5
      info.featureDomain = tableLayers[0].FeatureDomain;
      // /MapServer/12
      info.url = tableLayers[0].Url;
      // /../Data_Editing_CAMN_v2/FeatureServer/1
      info.writeUrl = tableLayers[0].WriteUrl;
      // "/MapServer/12" -> "12"
      info.relatedTableId = tableLayers[0].Url.split('/').pop();
    }
  }

  return info;
}
