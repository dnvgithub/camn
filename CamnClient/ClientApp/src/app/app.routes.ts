import { Routes } from '@angular/router';
import { CamnComponent } from './camn/camn.component';


export function getRoutes(defaultPath: string = 'camn'): Routes {

  return [
    {
      path: 'camn',
      component: CamnComponent
    },
    {
        path: '',
        redirectTo: `/${defaultPath}`,
        pathMatch: 'full'
    },
    { path: '**', redirectTo: `/${defaultPath}` }
  ];
}
