import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-join',
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss']
})
export class JoinComponent implements OnInit {

  email: string
  twitchUsername: string
  password: string
  confirmPassword: string

  constructor(public apiService: ApiService, private router: Router) { }

  ngOnInit() {
  }

  join() {
    // TODO: Check for confirm password
    this.apiService.join(this.email, this.password, this.twitchUsername)
    .subscribe(res => {
      localStorage.setItem('token', res.token);
      localStorage.setItem('email', res.email);
      localStorage.setItem('twitchUsername', res.twitchUsername);
      this.router.navigateByUrl('/dashboard')
    }, err => {
      //TODO
    });
  }

}
