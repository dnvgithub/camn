
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Action } from '@ngrx/store';

export interface UploadAttachmentsPayload {
  url: string;
  files: File[];
  modal: NgbModalRef;
  postUploadActions: Action[]; // Only execute these if the upload was successful
}

export const initialUploadAttachmentsPayload: UploadAttachmentsPayload = {
  url: '',
  files: [],
  modal: null,
  postUploadActions: []
};
