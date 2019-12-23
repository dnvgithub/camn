import { OnInit, Component, ChangeDetectionStrategy, Input } from '@angular/core';


@Component({
  // tslint:disable-next-line: component-selector
  selector: 'cctv-notes',
  templateUrl: './cctv-notes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CCTVNotesComponent implements OnInit {

  @Input() cctv: any;
  @Input() excludeFeatureList: any;
  @Input() video: string;

  ngOnInit(): void {
  }

  trackByFn(index, item) {
    return index;
  }
}
