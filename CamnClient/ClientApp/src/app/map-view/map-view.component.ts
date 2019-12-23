import {
  Component, ChangeDetectionStrategy, OnInit,
  Output, EventEmitter, Input, Inject, ViewChild, TemplateRef
} from '@angular/core';
import { MatDialog } from '@angular/material';

import { ClipboardService } from 'ngx-clipboard';

import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

import { Observable, Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import { takeUntil } from 'rxjs/operators';

import {
  MapViewAction, MapViewSave, MapViewSaveAs,
  MapViewDelete, MapViewSetLoadedId, MapViewClose,
  MapViewSaveDefault, MapViewDeleteDefault
} from './map-view.action';
import {
  MapViewState, ViewsAndSelection, initialMapViewsState,
  noLoadedMapView, MapView, currentMapView
} from './map-view.state';
import { AppState } from '../app.component';
import { ToastUserNotification, DelayedAction } from '../state-management/application/application.action';
import { ApplicationState } from '../state-management/application/application.state';
import { WINDOW } from '../services/window.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class MapViewComponent implements OnInit {

  @Input('mapViewState') set mapViewState(value: MapViewState) {
    if (value) {
      this._mapViewState = value;

      if (noLoadedMapView === value.loadedMapViewId) {
        this.selectedMapViewId = null;
        this.mapViewUserDefaultChecked = false;
      } else {
        this.selectedMapViewId = value.loadedMapViewId;
        if (value.loadedMapViewId === value.userDefaultMapViewId) {
          this.mapViewUserDefaultChecked = true;
        } else {
          this.mapViewUserDefaultChecked = false;
        }
      }
    }
  }
  @Output() mapViewOutput = new EventEmitter<MapViewAction>();
  @ViewChild('mapViewContent') mapViewContent: TemplateRef<any>;

  application$: Observable<ApplicationState>;

  public closeResult = '';
  public mapViewInputValue = '';
  public mapViewUserDefaultChecked = false;
  public selectedMapViewId: number = null;
  public _mapViewState: MapViewState = initialMapViewsState;
  public showDeleteConfirmationDialog = false;
  private ngUnsubscribe: Subject<void> = new Subject();
  isDialogOpen = false;
  _applicationState: ApplicationState;


  constructor(
    @Inject(WINDOW) private window: Window,
    private clipboardService: ClipboardService,
    private modalService: NgbModal,
    public dialog: MatDialog,
    private store: Store<AppState>
  ) {
    this.application$ = this.store.select('application');
  }
  ngOnInit(): void {
    this.application$.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe((state: ApplicationState) => {
      this._applicationState = state;
    });
  }

  openMapViewDialog() {
    this.hideConfirmationDialog();
    this.modalService.open(this.mapViewContent, { ariaLabelledBy: 'modal-basic-title', windowClass: 'map-view' });
  }

  save() {
    this.mapViewOutput.emit(new MapViewSave(null));
  }

  saveAs() {
    this.mapViewOutput.emit(new MapViewSaveAs(this.mapViewInputValue));
  }

  delete() {
    this.showDeleteConfirmationDialog = true;
  }

  confirmDelete() {
    this.mapViewOutput.emit(new MapViewDelete(null));
    this.hideConfirmationDialog();
  }

  cancelDelete() {
    this.hideConfirmationDialog();
  }

  hideConfirmationDialog() {
    this.showDeleteConfirmationDialog = false;
  }

  close() {
    this.mapViewOutput.emit(new MapViewClose(null));
  }

  copyLink() {
    this.mapViewUserDefaultChecked = !this.mapViewUserDefaultChecked;
    const link = this.shareLink();
    this.clipboardService.copyFromContent(link);

    this.mapViewOutput.emit(new ToastUserNotification({
      type: 'success',
      title: 'Share Link Copied to Clipboard',
      message: link,
      options: {}
    }));
  }

  shareLink(): string {
    let shareId = '';
    const mapView: MapView = currentMapView(this._mapViewState);
    if (mapView && !this._mapViewState.isShared) {
      shareId = this.window.location.toString() + ';sharedId=' + mapView.shareId;
    }

    return shareId;
  }


  userDefaultSelectEnabled(): boolean {
    return this._mapViewState.loadedMapViewId > noLoadedMapView;
  }

  saveDisabled(): boolean {
    return this._mapViewState.loadedMapViewId < 0;
  }

  saveAsDisabled(): boolean {
    return this.mapViewInputValue.length <= 0;
  }

  deleteDisabled(): boolean {
    return this.saveDisabled() || (this._mapViewState.loadedMapViewId === this._mapViewState.userDefaultMapViewId);
  }

  closeDisabled(): boolean {
    return this.saveDisabled();
  }

  copyLinkDisabled(): boolean {
    return this.saveDisabled();
  }

  viewName(): string {
    let dirtyPrefix = '*';
    let name = 'Unsaved Map View';

    if (this._mapViewState) {
      if (this._mapViewState.isShared) {
        name = this._mapViewState.sharedMapView.bookmarkName + ' (Shared)';
      } else {
        if (!this._mapViewState.isDirty) {
          dirtyPrefix = '';
        }

        const mapView: MapView = currentMapView(this._mapViewState);
        if (mapView) {
          name = mapView.bookmarkName;
        }
      }
    }

    return dirtyPrefix + name;
  }

  onSelectMapViewChange() {

    const viewsAndSelection: ViewsAndSelection = {
      views: [],
      selectedId: noLoadedMapView
    };

    if (this.selectedMapViewId) {
      viewsAndSelection.selectedId = this.selectedMapViewId;
      this.checkDirtyView(viewsAndSelection);
    } else {
      this.mapViewOutput.emit(new MapViewSetLoadedId(viewsAndSelection));
    }
  }

  checkDirtyView(selectedView) {
    if (this._mapViewState.isDirty && this._mapViewState.loadedMapViewId > -1 && !this.isDialogOpen) {
      this.confirmDirtyViewSave(selectedView);
      this.isDialogOpen = true;
    } else {
      // view not dirty, load new map view
      this.mapViewOutput.emit(new MapViewSetLoadedId(selectedView));
    }

  }

  confirmDirtyViewSave(selectedView): void {
    let dialogWidth = '500px';
    let dialogHeight = '348px';
    if (this._applicationState.windowInnerWidth <= 767) {
      dialogWidth = '97vw';
      dialogHeight = '391px';
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: dialogWidth,
      height: dialogHeight,
      data: {
        message: 'Do you want to save changes to \"<strong>' + currentMapView(this._mapViewState).bookmarkName
          + '</strong>\" before loading the new map view?',
        title: 'Save Changes Before Loading?'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.isDialogOpen = false;
      if (result) {
        this.save();
      } else {
        this.mapViewOutput.emit(new MapViewSetLoadedId(selectedView));
      }

    });
  }


  onInputKeyUp(value: string) {
    this.mapViewInputValue = value;
  }

  userDefaultCheckbox() {
    if (this.mapViewUserDefaultChecked) {
      this.mapViewOutput.emit(new MapViewDeleteDefault(currentMapView(this._mapViewState)));
    } else {
      this.mapViewOutput.emit(new MapViewSaveDefault(currentMapView(this._mapViewState)));
    }
  }

  isDefault(mapViewId: number): boolean {
    return mapViewId === this._mapViewState.userDefaultMapViewId;
  }
}
