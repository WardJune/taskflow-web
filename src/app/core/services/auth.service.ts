import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environtments/environments';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiURL = environment.apiUrl;

  currentUser = signal<User | null>(null);
  isLoggedIn = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.loadUserFromStorage();
  }

  register(req: RegisterRequest) {
    return this.http
      .post<AuthResponse>(`${this.apiURL}/auth/register`, req)
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  login(req: LoginRequest) {
    return this.http
      .post<AuthResponse>(`${this.apiURL}/auth/login`, req)
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private handleAuthSuccess(response: AuthResponse) {
    console.log(response);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    this.currentUser.set(response.data.user);
    this.isLoggedIn.set(true);
  }

  private loadUserFromStorage() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.currentUser.set(JSON.parse(user));
      this.isLoggedIn.set(true);
    }
  }
}
