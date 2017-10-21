import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  navRoutes = [
    {
      title: 'Home',
      url: '/#/'
    },
    {
      title: 'Login',
      url: '/#/login'
    }
  ];
}
