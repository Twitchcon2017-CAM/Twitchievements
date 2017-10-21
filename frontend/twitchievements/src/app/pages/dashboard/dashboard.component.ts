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
  username: any
  error: any

  constructor(private apiService: ApiService) {

    this.apiService.getStats()
    .subscribe(res => {
      this.twitchievements = res.streamTwitchievements;

      console.log(res.userTwitchievements);
      console.log(Object.keys(res.userTwitchievements));

      // Finally set our twitchievements keys
      this.twitchievementsKeys = Object.keys(this.twitchievements);
    }, err => {
      this.error = err.error;
    });

    this.username = localStorage.getItem('twitchUsername');
  }

  ngOnInit() {
  }

}
