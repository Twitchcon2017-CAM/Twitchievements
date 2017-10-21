import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import 'rxjs/add/operator/retry';

import { environment } from '../../../environments/environment';
// https://xgrommx.github.io/rx-book/content/getting_started_with_rxjs/creating_and_querying_observable_sequences/creating_and_subscribing_to_simple_observable_sequences.html
import { Observable } from 'rxjs';


@Injectable()
export class ApiService {

  prodUrl: string
  devUrl: string
  apiUrl: string
  isLoading: boolean

  constructor(private http: HttpClient, private router: Router) {
    // TODO: Do some logic for prod
    this.prodUrl = '/api';
    this.devUrl = 'http://localhost:8000';
    if(environment.production) {
      this.apiUrl = this.prodUrl;
    } else {
      this.apiUrl = this.devUrl;
    }
    this.isLoading = false;
  }

  // Function to check for our jwt and bounce us to routes
  checkAuth() {
    this.router.navigateByUrl('/#/')
  }

  hasAuth() {
    if (localStorage.getItem('token')) {
      return true;
    } else {
      return false;
    }
  }

  login(email, password) {
    this.isLoading = true;
    return Observable.create(observer => {
      this.http.post(this.apiUrl + '/api/login', {
        email,
        password
      })
      .subscribe(res => {
        // handle Response
        observer.next(res);
        this.isLoading = false;
      }, err => {
        // TODO:
        observer.error(err);
        this.isLoading = false;
      });
    })
  }

  join(email, password, twitchUsername) {
    this.isLoading = true;
    return Observable.create(observer => {
      this.http.post(this.apiUrl + '/api/join', {
        email,
        password,
        twitchUsername
      })
      .subscribe(res => {
        // handle Response
        observer.next(res);
        this.isLoading = false;
      }, err => {
        // TODO:
        observer.error(err);
        this.isLoading = false;
      });
    })
  }

  getStats() {
    this.isLoading = true;
    return Observable.create(observer => {
      this.http.get(this.apiUrl + '/api/stats', {
        headers: new HttpHeaders().set('token', localStorage.getItem('token'))
      })
      .retry(1)
      .subscribe(res => {
        // handle Response
        observer.next(res);
        this.isLoading = false;
      }, err => {
        // TODO:
        observer.error(err);
        this.isLoading = false;
      });
    })
  }

  // No Toekn Required for this route
  getStreamerStats(streamer: string) {
    this.isLoading = true;
    return Observable.create(observer => {
      this.http.get(this.apiUrl + '/api/stats/' + streamer)
      .retry(1)
      .subscribe(res => {
        // handle Response
        observer.next(res);
        this.isLoading = false;
      }, err => {
        // TODO:
        observer.error(err);
        this.isLoading = false;
      });
    })
  }
}
