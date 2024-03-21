import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ServerService } from '../server.service';

interface PortfolioItem {
  stock: string;
  name: string;
  quantity: number;
  totalCost: number;
  avgCost: number;
  currentPrice: number;
  change: number;
  marketValue: number;
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, HttpClientModule, MatProgressSpinnerModule],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {

  wallet = 0;
  portfolioData: PortfolioItem[] = [];

  stock = "";

  showPortfolioView = false;
  showLoading = false;
  showEmptyPrompt = false;
  showBuyPrompt = false;
  showSellPrompt = false;

  constructor(
    private http: HttpClient,
    private serverService: ServerService
  ) { }

  ngOnInit() {
    this.showPortfolioView = false;
    this.showLoading = true;
    this.showEmptyPrompt = false;
    this.showBuyPrompt = false;
    this.showSellPrompt = false;
    this.getPortfolio();
  }

  getPortfolio() {
    try {
      const url = this.serverService.getServerUrl() + '/financial/getPortfolio';
      this.http.get<any>(url).subscribe({
        next: (result) => {
          this.showLoading = false;
          this.showPortfolioView = true;
          this.showEmptyPrompt = false;
          console.log('get data: ', result);
          if (Object.keys(result).length === 0 || Object.keys(result.portfolio).length === 0) {
            this.wallet = result.wallet ? result.wallet : 0;
            this.portfolioData = [];
            this.showEmptyPrompt = true;
            return;
          }
          this.wallet = result.wallet
          this.portfolioData = result.portfolio;
        }
      });
    } catch (error) {
      this.wallet = 0;
      this.portfolioData = [];
      this.showLoading = false;
      this.showPortfolioView = true;
      this.showEmptyPrompt = true;
    }
  }

  closeBuyPrompt() {
    this.showBuyPrompt = false;
  }

  closeSellPrompt() {
    this.showSellPrompt = false;
  }
}
