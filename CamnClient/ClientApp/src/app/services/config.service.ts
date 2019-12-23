import { Injectable } from '@angular/core';
import { DnvMapState } from 'dnv-lib';
import { AppConfig } from '../models/app.config';
import { LoggerOptions } from '../models/logger';

// To fix
// TS1219 TypeScript(TS) Experimental support for decorators is a feature that is subject to change in a future release.
// Set the 'experimentalDecorators' option to remove this warning.
// Change the "Build Action" on camn\CamnClient\ClientApp\tsconfig.json from None to Content per
// https://github.com/Microsoft/TypeScript/issues/25823
@Injectable()
export class ConfigService {
  constructor(private appConfig: AppConfig) { }
  initialDnvMapState(): DnvMapState { return this.appConfig.initialDnvMapState; }

  get defaultPath(): string { return this.appConfig.defaultPath; }

  get webApiEndpoint(): string {
    return this.appConfig.webApiEndpoint.endsWith('/') ? this.appConfig.webApiEndpoint : this.appConfig.webApiEndpoint + '/';
  }
  get cctvMediaService(): string {
    return this.appConfig.cctvMediaService.endsWith('/') ? this.appConfig.cctvMediaService : this.appConfig.cctvMediaService + '/';
  }
  get dnvButtonsUrl(): string { return this.appConfig.dnvButtonsUrl; }
  get dnvSearchApiEndpoint(): string { return this.appConfig.dnvSearchApiEndpoint; }
  get loggingOption(): LoggerOptions { return this.appConfig.loggingOption; }
  get legendsUrl(): string { return this.appConfig.legendsUrl; }
}

export function configServiceFactory(): () => ConfigService {
  return () => new ConfigService(window['appConfig']);
}

