import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import 'rxjs/add/operator/retry';
// https://xgrommx.github.io/rx-book/content/getting_started_with_rxjs/creating_and_querying_observable_sequences/creating_and_subscribing_to_simple_observable_sequences.html
import { Observable } from 'rxjs';


@Injectable()
export class ApiService {

  prodUrl: string
  devUrl: string
  apiUrl: string

  constructor(private http: HttpClient, private router: Router) {
    // TODO: Do some logic for prod
    this.prodUrl = '//twitchievements.com/api/';
    this.devUrl = 'http://localhost:8000';
    this.apiUrl = this.devUrl;
  }

  // Function to check for our jwt and bounce us to routes
  checkAuth() {
    this.router.navigateByUrl('/#/')
  }

  login(username, password) {
    return Observable.create(observer => {
      this.http.post(this.apiUrl + '/login', {
        username,
        password
      })
      .retry(1)
      .subscribe(res => {
        // handle Response
        observer.next(res);
      }, err => {
        // TODO:
        observer.error(err);
      });
    })
  }

  join(username, password) {
    return Observable.create(observer => {
      this.http.post(this.apiUrl + '/join', {
        username,
        password
      })
      .retry(1)
      .subscribe(res => {
        // handle Response
        observer.next(res);
      }, err => {
        // TODO:
        observer.error(err);
      });
    })
  }

  getStats() {
    // TODO: grab a token
    return Observable.create(observer => {
      this.http.get(this.apiUrl + '/join', {
        headers: new HttpHeaders().set('token', 'TODO')
      })
      .retry(1)
      .subscribe(res => {
        // handle Response
        observer.next(res);
      }, err => {
        // TODO:
        observer.error(err);
      });
    })
  }

  getStreamerStats(streamer: string) {
    // TODO: grab a token
    return Observable.create(observer => {
      this.http.get(this.apiUrl + '/stats/' + streamer)
      .retry(1)
      .subscribe(res => {
        // handle Response
        observer.next(res);
      }, err => {
        // TODO:
        observer.error(err);
      });
    })
  }
}
