import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import { ApiService } from '../../services/api/api.service';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-streamer',
  templateUrl: './streamer.component.html',
  styleUrls: ['./streamer.component.scss']
})
export class StreamerComponent implements OnInit {

  twitchievements: any
  twitchievementsKeys: any
  streamerId: string
  error: any

  constructor(public apiService: ApiService, private route: ActivatedRoute) {
    this.streamerId = this.route.snapshot.params['id']
    this.apiService.getStreamerStats(this.route.snapshot.params['id'])
    .subscribe(res => {
      this.twitchievements = res.streamTwitchievements;

      // Finally set our twitchievements keys
      this.twitchievementsKeys = Object.keys(this.twitchievements);
    }, err => {
      this.error = err.error;
    });
  }

  ngOnInit() {
    new (<any>window).Twitch.Embed("twitch-embed", {
        width: 854,
        height: 480,
        channel: this.route.snapshot.params['id']
    });
  }

}
