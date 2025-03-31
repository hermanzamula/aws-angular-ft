import { TestBed } from '@angular/core/testing';
import { Store, provideStore } from '@ngxs/store';
import { TaskState } from './task.state';
import { TaskService } from '../../services/task.service';
import { of } from 'rxjs';
import { Task } from '../../../../../shared/models/task';
import { LoadTasks, SubmitTask } from './task.actions';

describe('Task state', () => {
  let store: Store;
  let taskServiceMock: { submitTask: jest.Mock, getTasks: jest.Mock };

  const mockTasks: Task[] = [
    { taskId: '1', answer: 'Task 1', status: 'Pending', retries: 0, errorMessage: '' },
    { taskId: '2', answer: 'Task 2', status: 'Processed', retries: 0, errorMessage: '' }
  ];

  beforeEach(() => {
    taskServiceMock = {
      submitTask: jest.fn(),
      getTasks: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideStore([TaskState]),
        { provide: TaskService, useValue: taskServiceMock }
      ]
    });

    store = TestBed.inject(Store);
  });

  it('should create an empty state', () => {
    const actual = store.selectSnapshot(TaskState.tasks);
    expect(actual).toEqual([]);
  });

  it('should load tasks', () => {
    taskServiceMock.getTasks.mockReturnValue(of(mockTasks));

    store.dispatch(new LoadTasks());

    const actual = store.selectSnapshot(TaskState.tasks);
    expect(actual).toEqual(mockTasks);
  });

  it('should submit a task', () => {
    const newTask: Task = { taskId: '3', answer: 'Task 3', status: 'Pending', retries: 0, errorMessage: '' };
    taskServiceMock.submitTask.mockReturnValue(of(newTask));

    store.dispatch(new SubmitTask(newTask));

    expect(taskServiceMock.submitTask).toHaveBeenCalledWith(newTask);
  });

  it('should set loading state to true when submitting a task and false after submission', () => {
    taskServiceMock.submitTask.mockReturnValue(of({}));

    store.dispatch(new SubmitTask({ taskId: '3', answer: 'Task 3', status: 'Pending', retries: 0, errorMessage: '' }));

    const loading = store.selectSnapshot(TaskState.loading);
    expect(loading).toBe(false);
  });
});
