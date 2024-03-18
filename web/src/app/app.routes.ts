import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { StockDetailComponent } from './stock-detail/stock-detail.component';
import { WatchlistComponent } from './watchlist/watchlist.component';
import { PortfolioComponent } from './portfolio/portfolio.component';

export const routes: Routes = [
    { path: '', redirectTo: 'search/home', pathMatch: 'full' },
    { path: 'search/home', title: 'Stock home', component: HomeComponent },
    { path: 'search/:stock', title: 'Stock Search', component: StockDetailComponent },
    { path: 'watchlist', title: 'Stock watchlist', component: WatchlistComponent },
    { path: 'portfolio', title: 'Stock portfolio', component: PortfolioComponent },
    { path: '**', redirectTo: 'search/home', pathMatch: 'full' }
];
