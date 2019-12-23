import { Injectable, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Params } from '@angular/router';
import { Store, Action } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { flatMap, withLatestFrom, map, delay } from 'rxjs/operators';
import { URLParametersActionType, SetStateFromParams } from './url-parameters.action';
import { AppState } from '../app.component';

import { MapViewLoadSharedId, MapViewLoadDefault } from '../map-view/map-view.action';

@Injectable()
export class URLParametersEffects implements OnInit {

  @Effect({ dispatch: false }) UpdateURLParamsEffect$ = this.actions$.pipe(
    ofType(URLParametersActionType.UpdateURLParams),
    withLatestFrom(this.store$),
    map(([, store]) => {
      return { state: store };
    }),
    flatMap((childParams) => {

      const fullUrl = this.router.url;
      const semicolonIndex = fullUrl.indexOf(';');
      const newUrl = (semicolonIndex > -1) ? fullUrl.substring(0, semicolonIndex) : fullUrl;

      this.router.navigateByUrl(newUrl);

      return [];
    })
  );

  @Effect() SetStateFromParams$ = this.actions$.pipe(
    ofType(URLParametersActionType.SetStateFromParams),
    delay(2222), // TODO this is to temporarily resolve the timing issue
    // of waiting for the layer definitions to finish loading before
    // applying the Map View...
    flatMap((action: SetStateFromParams) => {
      const params: Params = action.payload;

      const actions: Action[] = [];
      const sharedId: string = params['sharedId'];
      if (sharedId) {
        actions.push(new MapViewLoadSharedId(sharedId));
      } else {
        actions.push(new MapViewLoadDefault());
      }

      return actions;
    })
  );

  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void { }

}
