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
  password: string
  confirmPassword: string

  constructor(private apiService: ApiService, private router: Router) { }

  ngOnInit() {
  }

  join() {
    // TODO: Check for confirm password
    this.apiService.join(this.email, this.password)
    .subscribe(res => {
      this.router.navigateByUrl('/#/dashboard')
    }, err => {
      //
    });
  }

}
