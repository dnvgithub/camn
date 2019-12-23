import { BrowserModule } from '@angular/platform-browser';
import { NgModule, enableProdMode, isDevMode, ErrorHandler } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ClipboardModule } from 'ngx-clipboard';
import { ToastrModule } from 'ngx-toastr';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { storeLogger } from './actionLogger/actionLogger';

import { StoreModule, ActionReducer, MetaReducer } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { AppComponent } from './app.component';
import { CamnComponent } from './camn/camn.component';
import { UrlParametersComponent } from './url-parameters/url-parameters.component';
import { MapViewComponent } from './map-view/map-view.component';
import { CCTVNotesComponent } from './cctv/cctv-notes.component';
import { AddAttachmentsComponent } from './add-attachments/add-attachments.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';

import { applicationReducer } from './state-management/application/application.reducer';
import { ApplicationEffects } from './state-management/application/application.effect';
import { AddAttachmentsEffects } from './add-attachments/add-attachments.effect';
import { URLParametersEffects } from './url-parameters/url-parameters.effect';

import { mapViewReducer } from './map-view/map-view.reducer';
import { MapViewEffects } from './map-view/map-view.effect';

import {
  DnvModule, dnvMapReducer, layerReducer,
  LayerEffects, BaseMapEffects, baseMapReducer,
  DnvSearchEffects, dnvSearchReducer,
  ToastrEffects, legendReducer, DnvLegendEffects
} from 'dnv-lib';

import { WINDOW_PROVIDERS } from './services/window.service';
import { ConfigService, configServiceFactory } from './services/config.service';
import { SearchService } from './services/search.service';
import { ApplicationService } from './services/application.service';
import { NgxGalleryModule } from 'ngx-gallery';
import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import * as $ from 'jquery';
import { ngfModule, ngf } from 'angular-file';

// https://github.com/ngrx/platform/blob/master/docs/store-devtools/README.md
// import {StoreDevtoolsModule} from '@ngrx/store-devtools'; // uncomment here and below to enable the dev tools

export function log(reducer: ActionReducer<any>): ActionReducer<any> {
  const verbose = true;

  if (window['environment'] === 'Development') {
    return storeLogger()(reducer);
  } else {
    return storeLogger(window['appConfig']['loggingOption'])(reducer);
  }
}

export function appEnvironment(value: string): boolean {
  return value === (window['environment'] || '');
}
if (appEnvironment('production')) {
  enableProdMode();
}

// set to true to output messages to console
const metaReducers: MetaReducer<any>[] = [log];

const reducers = {
  mapState: dnvMapReducer,
  application: applicationReducer,
  layerState: layerReducer,
  legendState: legendReducer,
  baseMapState: baseMapReducer,
  dnvSearchState: dnvSearchReducer,
  mapViewState: mapViewReducer
};
declare var Hammer: any;

export class MyHammerConfig extends HammerGestureConfig {

  buildHammer(element: HTMLElement) {
    const mc = new Hammer(element, {
      touchAction: 'auto'
    });

    mc.get('pan').set({ threshold: 5 });
    mc.get('swipe').set({
      velocity: 0.4,
      threshold: 20,
      direction: Hammer.DIRECTION_ALL
    });
    return mc;
  }
}

@NgModule({
  declarations: [
    AppComponent,
    CamnComponent,
    UrlParametersComponent,
    MapViewComponent,
    CCTVNotesComponent,
    AddAttachmentsComponent,
    ConfirmDialogComponent
  ],
  entryComponents: [
    CamnComponent,
    ConfirmDialogComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    ClipboardModule, // 1/1 ngx-clipboard requirement
    CommonModule,             // 1/3 ngx-toastr requirements:
    BrowserAnimationsModule,  // 2/3 required animations module
    ToastrModule.forRoot({    // 3/3 ToastrModule added
      // disableTimeOut: true, // Set to true for errors so that they stay visible
      positionClass: 'toast-bottom-right',
      preventDuplicates: false,
    }),
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgbModule,
    ngfModule,
    RouterModule.forRoot([], { enableTracing: false }), // Set to an empty array here and reset in the app.component constructor
    StoreModule.forRoot(reducers, { metaReducers: metaReducers }), // <- @ngrx/store reducers
    // StoreRouterConnectingModule.forRoot({
    //   /*
    //     They stateKey defines the name of the state used by the router-store reducer.
    //     This matches the key defined in the map of reducers
    //   */
    //   stateKey: 'router',
    // }),
    EffectsModule.forRoot([
      ApplicationEffects
      , LayerEffects
      , BaseMapEffects
      , DnvSearchEffects
      , URLParametersEffects
      , MapViewEffects
      , AddAttachmentsEffects
      , ToastrEffects
      , DnvLegendEffects
    ]), // <- @ngrx/effects
    DnvModule,
    NgxGalleryModule,
    MatDialogModule,
    MatButtonModule
  ],
  providers: [
    { provide: ConfigService, useFactory: configServiceFactory() }
    , WINDOW_PROVIDERS
    , SearchService
    , ApplicationService
    , {
      provide: HAMMER_GESTURE_CONFIG
      , useClass: MyHammerConfig
    }
  ],
  bootstrap: [AppComponent]
})

export class AppModule { }
