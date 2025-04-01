import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { Task, TaskRequest } from '../../../../shared/models/task';
import { environment } from '../../environments/environment';
import { provideHttpClient } from '@angular/common/http';

describe('TaskService', () => {
  let service: TaskService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TaskService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should submit a task', () => {
    const mockTaskRequest: TaskRequest = {
      taskId: 'abc',
      answer: 'def',
    } as TaskRequest;
    let response: unknown = null;
    service.submitTask(mockTaskRequest).subscribe((resp) => {
      response = resp;
    });
    const req = httpTestingController.expectOne(`${environment.apiUrl}/v1/tasks`);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(mockTaskRequest);
    req.flush({ success: true });
    expect(response).toBeTruthy();
  });

  it('should get tasks', () => {
    const mockTasks: Task[] = [
      {
        taskId: '1',
        answer: 'Task 1',
        status: 'Pending',
        retries: 0,
        errorMessage: '',
      } as Task,
    ];
    let tasksResponse: unknown = null;
    service.getTasks().subscribe((tasks) => {
      tasksResponse = tasks;
    });
    const req = httpTestingController.expectOne(`${environment.apiUrl}/v1/tasks`);
    expect(req.request.method).toEqual('GET');
    req.flush({ items: mockTasks });
    expect(tasksResponse).toEqual(mockTasks);
  });
});
