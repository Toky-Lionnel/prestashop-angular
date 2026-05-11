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
    const apiUrl = `${this.url}/admin962dfddqafcqbyx1oq4/index.php?controller=AdminLogin`;

    const params = new URLSearchParams();
    params.append('email', username);
    params.append('passwd', password);
    params.append('submitLogin', '1');
    params.append('stay_logged_in', '1');
    params.append('controller', 'AdminLogin');
    params.append('ajax', '1');

    return from(
      axios.post(apiUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        responseType: 'text',
        withCredentials : true,
        // observe : 'response'
      })
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
