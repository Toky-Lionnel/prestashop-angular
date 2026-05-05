import { Injectable } from '@angular/core';
import axios from 'axios';
import { from, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  url = environment.prestashop_api_url;

  constructor() {
  }

  login(username: string, password: string): Observable<any> {
    const payload = { username, password };

    const apiUrl = `${this.url}/auth/login`;
    console.log(this.url);

    return from(
      axios.post(apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }).then(res => res.data)
    );
  }

  logout(): Observable<any> {
    const apiUrl = `${this.url}/auth/logout`;
    return from(
      axios.get(apiUrl, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }).then(res => res.data)
    );
  }

  clearClientAuthState(): void {
    // Keep this list explicit to avoid removing unrelated local/session data.
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
  }

}
