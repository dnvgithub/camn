import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';

@Component({
    selector: 'app-url-parameters',
    template: `<span></span>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class UrlParametersComponent implements OnInit {
    constructor() { }
    ngOnInit(): void { }
}
