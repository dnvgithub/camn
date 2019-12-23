import { Action } from '@ngrx/store';

import { UploadAttachmentsPayload, initialUploadAttachmentsPayload } from './add-attachments.state';


export const AddAttachmentsActionType = {
    CancelUpload: '[app-add-attachments] CancelUpload',
    UploadAttachments: '[app-add-attachments] UploadAttachments',
};

export class CancelUpload implements Action {
    type = AddAttachmentsActionType.CancelUpload;
    constructor() { }
}

export class UploadAttachments implements Action {
    type = AddAttachmentsActionType.UploadAttachments;
    constructor(public payload: UploadAttachmentsPayload = initialUploadAttachmentsPayload) { }
}

export type AddAttachmentsAction =
    CancelUpload |
    UploadAttachments
    ;
