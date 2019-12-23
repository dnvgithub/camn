import { Action } from '@ngrx/store';
import { UserNotification, KVSection } from './application.state';
import { SearchedInfo } from '../../models/search-info';

export const ApplicationActionType = {
  Search: '[application] Search',
  HpDrawer: '[application] HpDrawer', // <- New Type format for ease of global search
  UpdateWindowSize: '[application] UpdateWindowSize',
  CheckLayerDisplay: '[application] CheckLayerDisplay',
  ConcatSelectedFeatureSections: '[application] ConcatSelectedFeatureSections',
  SetDownloadLink: '[application] SetDownloadLink',
  GetCCTVInspection: '[application] GetCCTVInspection',
  GetCCTVNotes: '[application] GetCCTVNotes',
  GetFeatureData: '[application] GetFeatureData',
  GetFlowWorksData: '[application] GetFlowWorksData',
  GetAssetConditionData: '[application] GetAssetConditionData',
  GetSite: '[application] GetSite',
  IdentifySurroundingFeature: '[application] IdentifySurroundingFeature',
  Layer: '[application] Layer',
  IDLE: '[application] Idle',
  SetFeatureAttachment: '[application] SetFeatureAttachment',
  ShowThumbnails: '[application] ShowThumbnails',
  ToastUserNotification: '[application] ToastUserNotification',
  SetCCTVInspections: '[application] SetCCTVInspections',
  SetCCTVNotes: '[application] SetCCTVNotes',
  SetExternalFeature: '[application] SetExternalFeature',
  SetInspection: '[application] SetInspection',
  SetInspectionAttachments: '[application] SetInspectionAttachments',
  SetInspectionFields: '[application] SetInspectionFields',
  SetSelectedFeatureSections: '[application] SetSelectedFeatureSections',
  AddFieldsToFormGroup: '[application] AddFieldsToFormGroup',
  SetSurroundingFeature: '[application] SetSurroundingFeature',
  SetRetryContext: '[application] SetRetryContext',
  ToggleAlert: '[application] ToggleAlert',
  Legend: '[application] Legend',
  SaveNewInspection: '[application] SaveNewInspection',
  DelayedAction: '[application] DelayedAction'
};

export interface WindowSize {
  windowInnerHeight: number;
  windowInnerWidth: number;
}

export class Search implements Action {
  public type: string = ApplicationActionType.Search;

  constructor(public payload: SearchedInfo) { }
}

export class CheckLayerDisplay implements Action {
  public type: string = ApplicationActionType.CheckLayerDisplay;

  constructor(public payload: any = null) { }
}

export class ConcatSelectedFeatureSections implements Action {
  public type: string = ApplicationActionType.ConcatSelectedFeatureSections;
  constructor(public payload: KVSection) { }
}

export class SetDownloadLink implements Action {
  public type: string = ApplicationActionType.SetDownloadLink;

  constructor(public payload: any = null) { }
}

export class HpDrawer implements Action {
  public type: string = ApplicationActionType.HpDrawer;

  constructor(public payload: any = null) { }
}

export class UpdateWindowSize implements Action {
  public type: string = ApplicationActionType.UpdateWindowSize;

  constructor(public payload: WindowSize = { windowInnerHeight: 0, windowInnerWidth: 0 }) { }
}

export class Layer implements Action {
  public type: string = ApplicationActionType.Layer;

  constructor(public payload: any = null) { }
}

export class GetSite implements Action {
  public type: string = ApplicationActionType.GetSite;

  constructor(public payload: string) { }
}

export class IdentifySurroundingFeature implements Action {
  public type: string = ApplicationActionType.IdentifySurroundingFeature;

  constructor(public payload: string) { }
}

export class GetCCTVInspection implements Action {
  public type: string = ApplicationActionType.GetCCTVInspection;

  constructor(public payload: any) { }
}

export class GetCCTVNotes implements Action {
  public type: string = ApplicationActionType.GetCCTVNotes;

  constructor(public payload: any) { }
}

export class GetFeatureData implements Action {
  public type: string = ApplicationActionType.GetFeatureData;

  constructor(public payload: any) { }
}

export class GetFlowWorksData implements Action {
  public type: string = ApplicationActionType.GetFlowWorksData;

  constructor(public payload: string) { }
}

export class GetAssetConditionData implements Action {
  public type: string = ApplicationActionType.GetAssetConditionData;

  constructor(public payload: string) { }
}

export class Idle implements Action {
  public type: string = ApplicationActionType.IDLE;

  constructor(public payload: any = null) { }
}

export class SetCCTVInspections implements Action {
  public type: string = ApplicationActionType.SetCCTVInspections;
  constructor(public payload: any) { }
}

export class SetCCTVNotes implements Action {
  public type: string = ApplicationActionType.SetCCTVNotes;
  constructor(public payload: {
    objectId: string, galleryOptions: [], cctvData: {
      title: string,
      kvPair: Array<[string, string]>, img: { small: string, medium: string, big: string }[]
    }[]
  }) { }
}

export class SetFeatureAttachment implements Action {
  public type: string = ApplicationActionType.SetFeatureAttachment;
  constructor(public payload: any) { }
}

export class SetExternalFeature implements Action {
  public type: string = ApplicationActionType.SetExternalFeature;
  constructor(public payload: any) { }
}

export class ShowThumbnails implements Action {
  public type: string = ApplicationActionType.ShowThumbnails;
  constructor(public payload: any = null) { }
}

export class ToastUserNotification implements Action {
  public type: string = ApplicationActionType.ToastUserNotification;
  constructor(public payload: UserNotification = null) { }
}

export class SetInspection implements Action {
  public type: string = ApplicationActionType.SetInspection;
  constructor(public payload: any = null) { }
}

export class SetInspectionAttachments implements Action {
  public type: string = ApplicationActionType.SetInspectionAttachments;
  constructor(public payload: any = null) { }
}

export class SetInspectionFields implements Action {
  public type: string = ApplicationActionType.SetInspectionFields;
  constructor(public payload: any = null) { }
}

export class SetSelectedFeatureSections implements Action {
  public type: string = ApplicationActionType.SetSelectedFeatureSections;
  constructor(public payload: KVSection[]) { }
}

export class SetSurroundingFeature implements Action {
  public type: string = ApplicationActionType.SetSurroundingFeature;
  constructor(public payload: boolean) { }
}

export class SetRetryContext implements Action {
  public type: string = ApplicationActionType.SetRetryContext;
  constructor(public payload: any) { }
}

export class AddFieldsToFormGroup implements Action {
  public type: string = ApplicationActionType.AddFieldsToFormGroup;
  constructor(public payload: any = null) { }
}

export class ToggleAlert implements Action {
  public type: string = ApplicationActionType.ToggleAlert;
  constructor(public payload: boolean = null) { }
}

export class Legend implements Action {
  public type: string = ApplicationActionType.Legend;

  constructor(public payload: any = null) { }
}

export class SaveNewInspection implements Action {
  public type: string = ApplicationActionType.SaveNewInspection;

  constructor(public payload: any = null) { }
}

export class DelayedAction implements Action {
  public type: string = ApplicationActionType.DelayedAction;

  constructor(public payload: Action[] = []) { }
}

export type ApplicationAction =
  HpDrawer |
  UpdateWindowSize |
  CheckLayerDisplay |
  ConcatSelectedFeatureSections |
  SetDownloadLink |
  Layer |
  GetCCTVInspection |
  GetCCTVNotes |
  GetFeatureData |
  GetFlowWorksData |
  GetAssetConditionData |
  GetSite |
  IdentifySurroundingFeature |
  Idle |
  Search |
  ShowThumbnails |
  SetCCTVInspections |
  SetCCTVNotes |
  SetFeatureAttachment |
  ToastUserNotification |
  SetExternalFeature |
  SetInspection |
  SetInspectionAttachments |
  SetInspectionFields |
  SetSelectedFeatureSections |
  SetRetryContext |
  AddFieldsToFormGroup |
  SetSurroundingFeature |
  AddFieldsToFormGroup |
  ToggleAlert |
  Legend |
  SaveNewInspection |
  DelayedAction
  ;
