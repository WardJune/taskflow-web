import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environtments/environments';
import {
  AuthResponse,
  LoginRequest,
  MeResponse,
  RegisterRequest,
  User,
} from '../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, throwError } from 'rxjs';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

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

  me() {
    return this.http.get<ApiResponse<MeResponse>>(`${this.apiURL}/me`);
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

  validateUser() {
    const token = this.getToken();

    if (!token) {
      console.log('no token');
      this.logout();
      return throwError(() => new Error('No token found'));
    }

    return this.me().pipe(
      tap({
        next: (res) => {
          if (!res.success) {
            this.logout();
          }
        },
        error: (err) => {
          this.logout();
        },
      }),
    );
  }

  private handleAuthSuccess(response: AuthResponse) {
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
