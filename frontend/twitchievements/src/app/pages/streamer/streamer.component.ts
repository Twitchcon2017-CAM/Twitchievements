import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import { ApiService } from '../../services/api/api.service';

@Component({
  selector: 'app-streamer',
  templateUrl: './streamer.component.html',
  styleUrls: ['./streamer.component.scss']
})
export class StreamerComponent implements OnInit {

  constructor(private apiService: ApiService, private route: ActivatedRoute) {
    this.apiService.getStreamerStats(this.route.snapshot.params['id'])
    .subscribe(res => {

    }, err => {

    });
  }

  ngOnInit() {
  }

}
