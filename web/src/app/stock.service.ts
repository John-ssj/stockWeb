import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private stockSource = new BehaviorSubject<string>('');
  stock$ = this.stockSource.asObservable();
  
  updateStock(stock: string) {
    this.stockSource.next(stock);
  }
}
