import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  taskForm: FormGroup<{ answer: FormControl<string | null> }>;
  tasks$: Observable<Task[]>;
  loading$: Observable<boolean>;
  subscriptions: Subscription;
  protected readonly answerMaxLength = 200;

  constructor(
    private fb: FormBuilder,
    private store: Store,
  ) {
    this.taskForm = this.fb.group({
      answer: new FormControl('', { validators: [Validators.required, Validators.maxLength(this.answerMaxLength)] }),
    });
    this.tasks$ = this.store.select(TaskState.tasks);
    this.loading$ = this.store.select(TaskState.loading);
    this.subscriptions = new Subscription();
  }

  ngOnInit(): void {
    this.store.dispatch(new LoadTasks());
    this.subscriptions.add(
      interval(5000).subscribe(() => {
        this.store.dispatch(new LoadTasks());
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions?.unsubscribe();
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      console.log('Form invalid');
      return;
    }

    const answer = this.taskForm.value.answer!;
    const task: Task = {
      taskId: crypto.randomUUID(),
      answer,
      status: 'Pending',
      retries: 0,
      errorMessage: '',
    };
    this.subscriptions.add(
      this.store.dispatch(new SubmitTask(task)).subscribe(() => {
        this.taskForm.reset();
      }),
    );
  }

  refreshTasks(): void {
    this.store.dispatch(new LoadTasks());
  }
}
