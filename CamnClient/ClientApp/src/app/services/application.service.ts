import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { Injectable } from '@angular/core';
import { LogMsg } from '../models/logger';

@Injectable()
export class ApplicationService {

  constructor(
    private _httpClient: HttpClient,
    private _configService: ConfigService
  ) { }

  getFlowWorksData(url: string) {
    return this._httpClient.get(url);
  }

  identifySurroundingFeature(url: string) {
    return this._httpClient.get(url);
  }

  getGisFeatureData(url: string) {
    return this._httpClient.get(url);
  }
}
