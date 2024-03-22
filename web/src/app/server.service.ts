import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServerService {
  private serverUrl = 'https://web3-node-418010.wm.r.appspot.com';
  
  getServerUrl() {
    return this.serverUrl;
  }
}
