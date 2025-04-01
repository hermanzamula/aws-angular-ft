import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Task, TaskRequest } from '../../../../shared/models/task';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  submitTask(task: TaskRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/v1/tasks`, task);
  }

  getTasks(): Observable<Task[]> {
    return this.http.get<{ items: Task[] }>(`${this.baseUrl}/v1/tasks`).pipe(map((data) => data.items));
  }
}
