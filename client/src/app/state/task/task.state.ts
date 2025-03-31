import { State, Action, StateContext, Selector } from '@ngxs/store';
import { SubmitTask, LoadTasks } from './task.actions';
import { Injectable } from '@angular/core';
import { tap, catchError } from 'rxjs/operators';
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
    loading: false
  }
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
    ctx.patchState({ loading: true });
    return this.taskService.submitTask(action.payload).pipe(
      tap(() => ctx.patchState({ loading: false })),
      catchError(() => {
        ctx.patchState({ loading: false });
        return of(null);
      })
    );
  }

  @Action(LoadTasks)
  loadTasks(ctx: StateContext<TaskStateModel>) {
    return this.taskService.getTasks().pipe(
      tap((tasks) => ctx.patchState({ tasks })),
      catchError(() => of([]))
    );
  }
}
