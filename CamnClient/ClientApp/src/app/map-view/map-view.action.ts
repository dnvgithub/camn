import { Action } from '@ngrx/store';

import { DnvMapState } from 'dnv-lib';

import { MapView, ViewsAndSelection, initialViewsAndSelection } from './map-view.state';

export const MapViewActionType = {
    MapViewLoad: '[app-map-view] MapViewLoad',
    MapViewLoadSharedId: '[app-map-view] MapViewLoadSharedId',
    MapViewSet: '[app-map-view] MapViewSet', // populate the list of views saved by the user
    MapViewSetLoadedId: '[app-map-view] MapViewSetLoadedId',
    MapViewSetSharedView: '[app-map-view] MapViewSetSharedView',
    MapViewSave: '[app-map-view] MapViewSave',
    MapViewSaveAs: '[app-map-view] MapViewSaveAs',
    MapViewDelete: '[app-map-view] MapViewDelete',
    MapViewClose: '[app-map-view] MapViewClose',
    MapViewCheckIsDirty: '[app-map-view] MapViewCheckIsDirty',
    MapViewMarkDirty: '[app-map-view] MapViewMarkDirty',
    MapViewLoadDefault: '[app-map-view] MapViewLoadDefault',
    MapViewSetDefault: '[app-map-view] MapViewSetDefault',
    MapViewSaveDefault: '[app-map-view] MapViewSaveDefault',
    MapViewDeleteDefault: '[app-map-view] MapViewDeleteDefault',
};

export class MapViewLoad implements Action {
    type = MapViewActionType.MapViewLoad;
    constructor(public payload: ViewsAndSelection = initialViewsAndSelection) { }
}

export class MapViewLoadSharedId implements Action {
    type = MapViewActionType.MapViewLoadSharedId;
    constructor(public payload: string = null) { }
}

export class MapViewSetSharedView implements Action {
    type = MapViewActionType.MapViewSetSharedView;
    constructor(public payload: MapView = null) { }
}

export class MapViewSet implements Action {
    type = MapViewActionType.MapViewSet;
    constructor(public payload: ViewsAndSelection = initialViewsAndSelection) { }
}

export class MapViewSetLoadedId implements Action {
    type = MapViewActionType.MapViewSetLoadedId;
    constructor(public payload: ViewsAndSelection = initialViewsAndSelection) { }
}

export class MapViewSave implements Action {
    type = MapViewActionType.MapViewSave;
    constructor(public payload: any) { }
}

export class MapViewSaveAs implements Action {
    type = MapViewActionType.MapViewSaveAs;
    constructor(public payload: string) { }
}

export class MapViewDelete implements Action {
    type = MapViewActionType.MapViewDelete;
    constructor(public payload: any) { }
}

export class MapViewClose implements Action {
    type = MapViewActionType.MapViewClose;
    constructor(public payload: any) { }
}

export class MapViewCheckIsDirty implements Action {
    type = MapViewActionType.MapViewCheckIsDirty;
    constructor() { }
}

export class MapViewMarkDirty implements Action {
    type = MapViewActionType.MapViewMarkDirty;
    constructor() { }
}

export class MapViewLoadDefault implements Action {
    type = MapViewActionType.MapViewLoadDefault;
    constructor() { }
}

export class MapViewSetDefault implements Action {
    type = MapViewActionType.MapViewSetDefault;
    constructor(public payload: number) { }
}

export class MapViewSaveDefault implements Action {
    type = MapViewActionType.MapViewSaveDefault;
    constructor(public payload: MapView) { }
}

export class MapViewDeleteDefault implements Action {
    type = MapViewActionType.MapViewDeleteDefault;
    constructor(public payload: MapView) { }
}


export type MapViewAction =
    MapViewLoad |
    MapViewLoadSharedId |
    MapViewSet |
    MapViewSetLoadedId |
    MapViewSetSharedView |
    MapViewSave |
    MapViewSaveAs |
    MapViewDelete |
    MapViewClose |
    MapViewCheckIsDirty |
    MapViewMarkDirty |
    MapViewLoadDefault |
    MapViewSetDefault |
    MapViewSaveDefault |
    MapViewDeleteDefault
    ;
