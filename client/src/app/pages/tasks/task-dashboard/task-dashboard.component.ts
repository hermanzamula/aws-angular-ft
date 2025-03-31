import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable, interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

import { TaskState } from '../../../state/task/task.state';
import { Task } from '../../../../../../shared/models/task';
import { LoadTasks, SubmitTask } from '../../../state/task/task.actions';

@Component({
  selector: 'app-task-dashboard',
  templateUrl: './task-dashboard.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: ['./task-dashboard.component.scss'],
})
export class TaskDashboardComponent implements OnInit, OnDestroy {
  taskForm: FormGroup;
  tasks$: Observable<Task[]>;
  loading$: Observable<boolean>;
  pollSub!: Subscription;

  constructor(
    private fb: FormBuilder,
    private store: Store,
  ) {
    this.taskForm = this.fb.group({ answer: [''] });
    this.tasks$ = this.store.select(TaskState.tasks);
    this.loading$ = this.store.select(TaskState.loading);
  }

  ngOnInit(): void {
    this.store.dispatch(new LoadTasks());
    this.pollSub = interval(5000).subscribe(() => {
      this.store.dispatch(new LoadTasks());
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  onSubmit(): void {
    const answer = this.taskForm.value.answer;
    const task: Task = {
      taskId: crypto.randomUUID(),
      answer,
      status: 'Pending',
      retries: 0,
      errorMessage: '',
    };
    this.store.dispatch(new SubmitTask(task)).subscribe(() => {
      this.taskForm.reset();
    });
  }
}
