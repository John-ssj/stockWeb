import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StockService } from '../stock.service';
import { SearchBarComponent } from '../search-bar/search-bar.component';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, SearchBarComponent],
  templateUrl: './home.component.html',
  styles: ``
})
export class HomeComponent {
  constructor(
    private stockService: StockService
  ) {}

  ngOnInit() {
    this.stockService.updateStock('');
  }
}
