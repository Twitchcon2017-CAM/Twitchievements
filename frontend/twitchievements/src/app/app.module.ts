import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';

import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';

const appRoutes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: HomeComponent
  },
  //{ path: '**', component: PageNotFoundComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    )
  ],
  providers: [
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
