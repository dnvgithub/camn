import { Action } from '@ngrx/store';
import { Params } from '@angular/router';

export const URLParametersActionType = {
    UpdateURLParams: '[app-url-parameters] UpdateURLParams',
    SetStateFromParams: '[app-url-parameters] SetStateFromParams'
};

export class UpdateURLParams implements Action {
  public type: string = URLParametersActionType.UpdateURLParams;

  constructor(public payload: any = null) { }
}

export class SetStateFromParams implements Action {
  public type: string = URLParametersActionType.SetStateFromParams;

  constructor(public payload: Params = null) { }
}

export type URLParametersAction =
UpdateURLParams
| SetStateFromParams
;
