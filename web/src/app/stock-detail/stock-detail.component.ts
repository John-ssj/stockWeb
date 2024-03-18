import { Component } from '@angular/core';
import { RouterLink, Router, ActivatedRoute, ParamMap } from '@angular/router';

import { StockService } from '../stock.service';

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [],
  template: `
    <p>
      stock-detail works!
    </p>
    <p>{{stock}}</p>
  `,
  styles: ``
})
export class StockDetailComponent {
  stock!: string;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stockService: StockService
  ) {}

  ngOnInit() {
    // this.stock = this.route.snapshot.paramMap.get('stock')!;
     this.route.params.subscribe(params => {
      this.stock = params['stock'];
      this.stockService.updateStock(this.stock);
    });
  }
}
