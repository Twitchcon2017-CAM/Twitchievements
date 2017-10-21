import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api/api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  twitchievements: any
  twitchievementsKeys: any
  userTwitchievements: any
  userTwitchievementsKeys: any
  username: any
  emoteFetch: any
  error: any

  constructor(public apiService: ApiService) {

    this.apiService.getStats()
    .subscribe(res => {
      this.twitchievements = res.streamTwitchievements;
      this.userTwitchievements = res.userTwitchievements;

      // Finally set our twitchievements keys
      this.twitchievementsKeys = [];
      if (this.twitchievements) {
        this.twitchievementsKeys = Object.keys(this.twitchievements);
      }
      this.userTwitchievementsKeys = [];
      if(this.userTwitchievements) {
        this.userTwitchievementsKeys = Object.keys(this.userTwitchievements);
      }
    }, err => {
      this.error = err.error;
    });

    this.username = localStorage.getItem('twitchUsername');
  }

  ngOnInit() {
  }

  getDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

}
