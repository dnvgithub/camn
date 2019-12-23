import {
  Component, ChangeDetectionStrategy, OnInit,
  Input, ElementRef, EventEmitter,
  AfterViewInit, Output
} from '@angular/core';

import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { UploadAttachmentsPayload } from './add-attachments.state';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-add-attachments',
  templateUrl: './add-attachments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddAttachmentsComponent implements OnInit, AfterViewInit {

  @Input() header: string;
  @Input() fileFieldID: string;
  @Output() uploadAttachmentsPayload = new EventEmitter<UploadAttachmentsPayload>();

  formGroup: FormGroup;

  modal: NgbModalRef = null;
  uploadDisabled = false;

  constructor(private modalService: NgbModal) { }
  ngOnInit(): void {
    this.formGroup = new FormGroup({
      files: new FormControl([])
    });
  }
  ngAfterViewInit() { }

  // TODO Watch this for ng-bootstrap animation... https://github.com/ng-bootstrap/ng-bootstrap/issues/295
  open(modal: ElementRef) {
    this.uploadDisabled = false;
    this.modal = this.modalService.open(modal);
  }

  upload() {
    this.uploadAttachmentsPayload.emit({
      url: '',
      files: this.formGroup.value['files'],
      modal: this.modal,
      postUploadActions: []
    });
  }

  close() {
    if (this.modal) {
      this.modal.close();
    }
  }
  dismiss() {
    if (this.modal) {
      this.modal.dismiss();
    }
  }

}
