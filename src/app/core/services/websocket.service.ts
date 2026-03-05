import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from './auth.service';

export interface WsNotification {
  type: 'task_created' | 'task_updated' | 'task_deleted';
  project_id: number;
  message: string;
  data: any;
}

@Injectable({
  providedIn: 'root',
})
export class WebsocketService implements OnDestroy {
  private socket: WebSocket | null = null;

  private notification$ = new Subject<WsNotification>();
  notifications$ = this.notification$.asObservable();

  constructor(private authService: AuthService) {}

  connect(projectId: number) {
    this.disconnect();

    const token = this.authService.getToken();
    if (!token) return;

    const url = `ws://localhost:8080/api/ws/projects/${projectId}?token=${token}`;

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const notif: WsNotification = JSON.parse(event.data);
        this.notification$.next(notif);
      } catch (e) {
        console.error('Failed to parse notification', e);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
