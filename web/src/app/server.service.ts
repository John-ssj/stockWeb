import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServerService {
  private serverUrl = 'http://127.0.0.1:8080';
  
  getServerUrl() {
    return this.serverUrl;
  }
}
