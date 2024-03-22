import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { ServerService } from '../server.service';
import { BuySellDialogComponent } from '../buy-sell-dialog/buy-sell-dialog.component';
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
    private serverService: ServerService,
    public dialog: MatDialog
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

  buySellStock(buy: boolean, stock: string) {
    try {
      const url = this.serverService.getServerUrl() + '/financial/getPrice?symbol=' + stock;
      this.http.get<any>(url).subscribe({
        next: (result) => {
          if (Object.keys(result).length !== 0) {
            const dialogRef = this.dialog.open(BuySellDialogComponent, {
              width: '480px',
              position: {
                top: '30px',
              },
              data: {
                "buy": buy,
                "stock": this.stock,
                "currentPrice": result.currentPrice,
                "wallet": result.wallet,
                "quantity": result.quantity
              }
            });
            dialogRef.afterClosed().subscribe(result => {
              const url = this.serverService.getServerUrl() + '/financial/' + (buy ? 'buy' : 'sell') + '?symbol=' + stock + '&quantity=' + result;
              this.http.get<any>(url).subscribe({
                next: (result) => {
                  if (Object.keys(result).length !== 0) {
                    if (result.success) {
                      this.showBuyPrompt = buy;
                      this.showSellPrompt = !buy;
                      setTimeout(() => {
                        this.showBuyPrompt = false;
                        this.showSellPrompt = false;
                      }, 5000);
                    }
                    this.wallet = result.wallet;
                    this.portfolioData = result.portfolio;
                    this.showEmptyPrompt = (this.portfolioData.length === 0);
                  }
                },
                error: (error) => {
                  console.error('Error:', error);
                }
              });
            });
          }
        },
        error: (error) => {
          console.error('Error:', error);;
        }
      });
    } catch (error) {
    }
  }

  closeBuyPrompt() {
    this.showBuyPrompt = false;
  }

  closeSellPrompt() {
    this.showSellPrompt = false;
  }
}
