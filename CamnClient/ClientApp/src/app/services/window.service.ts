import { InjectionToken, FactoryProvider } from '@angular/core';

// From https://stackoverflow.com/questions/36222845/how-to-get-domain-name-for-service-in-angular2

export const WINDOW = new InjectionToken<Window>('window');

const windowProvider: FactoryProvider = {
  provide: WINDOW,
  useFactory: () => window
};

export const WINDOW_PROVIDERS = [
    windowProvider
];
