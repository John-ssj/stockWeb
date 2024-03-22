import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ServerService } from '../server.service';

interface WatchListItem {
  stock: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, HttpClientModule, MatProgressSpinnerModule],
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css']
})
export class WatchlistComponent implements OnInit {
  watchListData: WatchListItem[] = [];

  showLoading = false;
  showEmptyPrompt = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private serverService: ServerService
  ) { }

  ngOnInit() {
    this.showEmptyPrompt = false;
    this.showLoading = true;
    this.getWatchList();
  }

  getWatchList() {
    try {
      const url = this.serverService.getServerUrl() + '/financial/getWatchList';
      this.http.get<any>(url).subscribe({
        next: (result) => {
          this.showLoading = false;
          this.showEmptyPrompt = false;
          if (Object.keys(result).length === 0 || Object.keys(result.watchList).length === 0) {
            this.watchListData = [];
            this.showEmptyPrompt = true;
            return;
          }
          this.watchListData = result.watchList;
        }
      });
    } catch (error) {
    }
  }

  uncollect(stock: string) {
    try {
      const url = this.serverService.getServerUrl() + '/financial/removeWatchList?symbol=' + stock;
      this.http.get<any>(url).subscribe({
        next: (result) => {
          if (Object.keys(result).length === 0) {
            this.getWatchList();
            return;
          }
          if (result.success) {
            this.watchListData = this.watchListData.filter(item => item.stock !== stock);
            if (this.watchListData.length === 0) {
              this.showEmptyPrompt = true;
            }
          }
        }
      });
    } catch (error) {
    }
  }

  navigateToDetailPage(stock: string) {
    this.router.navigateByUrl('/search/' + stock);
  }
}
