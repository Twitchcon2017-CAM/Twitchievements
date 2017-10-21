import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  email: string
  password: string

  constructor(public apiService: ApiService, private router: Router) {}

  ngOnInit() {
  }

  login() {
    this.apiService.login(this.email, this.password)
    .subscribe(res => {
      localStorage.setItem('token', res.token);
      localStorage.setItem('email', res.email);
      localStorage.setItem('twitchUsername', res.twitchUsername);
      this.router.navigateByUrl('/dashboard');
    }, err => {
      //
    });
  }

}
