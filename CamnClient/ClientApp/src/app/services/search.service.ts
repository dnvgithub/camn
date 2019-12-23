import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { SearchedInfo } from '../models/search-info';

@Injectable()
export class SearchService {

    constructor(
        private httpClient: HttpClient
    ) { }

    getGeoInfo(searchInfo: SearchedInfo) {
        const path = searchInfo.searchedItem.assetId ? 'asset' : (searchInfo.searchedItem.type === 2 ? 'street' : 'park');

        const id = searchInfo.searchedItem.assetId ? searchInfo.searchedItem.assetId : searchInfo.searchedItem.name;

        let url = searchInfo.apisUrl.endsWith('/') ? searchInfo.apisUrl : searchInfo.apisUrl + '/';
        url += `${path}/${id}`;

        return this.httpClient.get(url);
    }
}
