import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private stockSource = new BehaviorSubject<string>('');
  stock$ = this.stockSource.asObservable();
  
  private stockDataSource = new BehaviorSubject<any>({});
  stockData$ = this.stockDataSource.asObservable();
  
  updateStock(stock: string) {
    this.stockSource.next(stock);
  }

  getStock() {
    return this.stockSource.getValue();
  }

  updateStockData(stockData: any) {
    this.stockDataSource.next(stockData);
  }

  getStockData() {  
    return this.stockDataSource.getValue();
  }
}
