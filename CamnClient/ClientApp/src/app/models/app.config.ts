import { DnvMapState } from 'dnv-lib';
import { LoggerOptions } from './logger';

export class AppConfig {
  initialDnvMapState: DnvMapState;
  liveUpdateServiceUrl: string;
  webApiEndpoint: string;
  cctvMediaService: string;
  defaultPath: string;
  dnvButtonsUrl: string;
  fcRootUrl: string;
  dnvSearchApiEndpoint: string;
  loggingOption: LoggerOptions;
  legendsUrl: string;
}
