import { State, Action, StateContext, Selector } from '@ngxs/store';
import { SubmitTask, LoadTasks } from './task.actions';
import { Injectable } from '@angular/core';
import { tap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { Task } from '../../../../../shared/models/task';
import { TaskService } from '../../services/task.service';

export interface TaskStateModel {
  tasks: Task[];
  loading: boolean;
}

@State<TaskStateModel>({
  name: 'taskState',
  defaults: {
    tasks: [],
    loading: false,
  },
})
@Injectable()
export class TaskState {
  constructor(private taskService: TaskService) {}

  @Selector()
  static tasks(state: TaskStateModel) {
    return state.tasks;
  }

  @Selector()
  static loading(state: TaskStateModel) {
    return state.loading;
  }

  @Action(SubmitTask)
  submitTask(ctx: StateContext<TaskStateModel>, action: SubmitTask) {
    const defaultTaskState: Task = { ...action.payload, status: 'Pending', retries: 0, errorMessage: '' };
    ctx.patchState({
      loading: true,
      tasks: [defaultTaskState, ...ctx.getState().tasks],
    });
    return this.taskService.submitTask(action.payload).pipe(
      catchError(() => of(null)),
      finalize(() => ctx.patchState({ loading: false })),
    );
  }

  @Action(LoadTasks)
  loadTasks(ctx: StateContext<TaskStateModel>) {
    return this.taskService.getTasks().pipe(
      tap((tasks) => ctx.patchState({ tasks })),
      catchError(() => of([])),
    );
  }
}
