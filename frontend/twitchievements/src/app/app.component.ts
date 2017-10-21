import { Component } from '@angular/core';
import { ApiService } from './services/api/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  navRoutes = [
    {
      title: 'Home',
      url: '/#/'
    },
    {
      title: 'Login',
      url: '/#/login',
      hideOnAuth: true
    },
    {
      title: 'Join',
      url: '/#/join',
      hideOnAuth: true
    },
    {
      title: 'Dashboard',
      url: '/#/dashboard',
      requiresAuth: true
    }
  ];

  constructor(public apiService: ApiService, private router: Router) { }

  logout() {
    localStorage.removeItem('token');
    this.router.navigateByUrl('');
  }
}
