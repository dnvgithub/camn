import { Injectable, Inject } from '@angular/core';
import { Store, Action } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { from, of } from 'rxjs';
import { flatMap, withLatestFrom, map, switchMap, takeWhile, catchError, concatMap, filter, toArray, tap } from 'rxjs/operators';
import {
  HttpClient, HttpRequest,
  HttpResponse, HttpEvent, HttpEventType
} from '@angular/common/http';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { FeatureClicked } from 'dnv-lib';

import { AppState } from '../app.component';

import { AddAttachmentsActionType, CancelUpload, UploadAttachments } from './add-attachments.action';
import { UploadAttachmentsPayload } from './add-attachments.state';

import { ToastUserNotification } from '../state-management/application/application.action';

@Injectable()
export class AddAttachmentsEffects {

  // Refactor this...
  private modal: NgbModalRef = null;
  private postUploadActions: Action[] = [];


  @Effect() getFlowWorksData$ = this.actions$.pipe(
    ofType(AddAttachmentsActionType.UploadAttachments, AddAttachmentsActionType.CancelUpload),
    switchMap((action: Action) => {
      if (AddAttachmentsActionType.CancelUpload === action.type) {
        // tslint:disable-next-line:deprecation
        return of([{
          status: 'cancel',
          event: null
        }]);

      } else {
        const uploadAttachmentsPayload: UploadAttachmentsPayload = (action as UploadAttachments).payload;
        this.modal = uploadAttachmentsPayload.modal;
        this.postUploadActions = uploadAttachmentsPayload.postUploadActions;

        return from(uploadAttachmentsPayload.files)
          .pipe(

            // Switched to concatMap instead of mergeMap so that uploads are performed sequentially.
            // For some reason, one of the uploads would always end up taking longer when performed in parallel.
            concatMap(file => {
              const sendableFormData: FormData = new FormData();
              sendableFormData.append('attachment', file, file.name);
              sendableFormData.append('f', 'pjson');
              return this.httpClient.request(
                new HttpRequest(
                  'POST',
                  uploadAttachmentsPayload.url,
                  sendableFormData
                )
              ).pipe(

                // Only keep the HttpResponse (HttpEventType.Response), not the other update events
                filter(response => response instanceof HttpResponse),

                map((data: HttpResponse<any>) => {

                  // Dispatch upload notification as each upload completes
                  if (data.ok) {
                    this.store$.dispatch(
                      new ToastUserNotification({
                        type: 'success',
                        title: 'File Uploaded',
                        message: 'File ' + file.name + ' was successfully uploaded.',
                        options: {}
                      })
                    );

                    return {
                      status: 'success',
                      event: file.name
                    };
                  } else {
                    return {
                      status: 'erreur',
                      event: file.name
                    };
                  }
                }),
                catchError(data => {
                  return [{
                    status: 'erreur',
                    event: file.name
                  }];
                })
              );
            }),
            toArray()
          );
      }
    })
    ,
    withLatestFrom(this.store$),
    map(([data, store]) => {
      return {
        d: data,
        s: store // TODO with postUploadActions, the store is not needed anymore
      };
    }),
    flatMap((data) => {
      let closeDialog = true;
      // let refreshAttachments = false;
      let uploadSuccessful = true;
      const actions: Action[] = [];
      data.d.forEach(d => {
        if (d.status === 'success') {
          // do nothing
          // refreshAttachments = refreshAttachments || true;
        } else if (d.status === 'cancel') {
          actions.push(new ToastUserNotification({
            type: 'warning',
            title: 'File Uploaded Cancelled',
            message: 'The file upload was canceled.',
            options: {}
          }));
        } else {
          closeDialog = false;
          uploadSuccessful = false;
          actions.push(new ToastUserNotification({
            type: 'error',
            title: 'File Uploaded Failed',
            message: 'File ' + d.event + ' could not be uploaded.',
            options: {
              disableTimeOut: true
            }
          }));
        }
      });

      if (closeDialog && this.modal) {
        this.modal.dismiss();
        this.modal = null;
      }

      if (uploadSuccessful) {
        actions.push(...this.postUploadActions);
      }

      return actions;
    })
  );

  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private httpClient: HttpClient,
  ) { }

}

