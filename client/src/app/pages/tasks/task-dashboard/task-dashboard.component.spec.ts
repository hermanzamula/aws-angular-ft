import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { Store } from '@ngxs/store';
import { TaskDashboardComponent } from './task-dashboard.component';
import { LoadTasks } from '../../../state/task/task.actions';

describe('TaskDashboardComponent', () => {
  let component: TaskDashboardComponent;
  let fixture: ComponentFixture<TaskDashboardComponent>;
  let storeMock: Store;

  beforeEach(async () => {
    storeMock = {
      select: jest.fn().mockImplementation((selector: any) => {
        if (selector.name === 'tasks') {
          return of([]);
        } else if (selector.name === 'loading') {
          return of(false);
        }
        return of();
      }),
      dispatch: jest.fn().mockImplementation(() => of({})),
    } as any;

    await TestBed.configureTestingModule({
      imports: [TaskDashboardComponent, ReactiveFormsModule],
      providers: [{ provide: Store, useValue: storeMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    (storeMock.dispatch as jest.Mock).mockClear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch LoadTasks on ngOnInit', () => {
    component.ngOnInit();
    expect(storeMock.dispatch).toHaveBeenCalledWith(new LoadTasks());
  });

  it('should unsubscribe from subscriptions on ngOnDestroy', () => {
    component.ngOnInit();
    jest.spyOn(component.subscriptions, 'unsubscribe');
    component.ngOnDestroy();
    expect(component.subscriptions.unsubscribe).toHaveBeenCalled();
  });

  it('should not submit if the form is invalid', () => {
    component.taskForm.setValue({ answer: '' });
    component.onSubmit();
    expect(storeMock.dispatch).not.toHaveBeenCalled();
  });

  it('should dispatch SubmitTask with the form value', () => {
    const answer = 'test answer';
    component.taskForm.setValue({ answer: answer });
    component.onSubmit();
    expect(storeMock.dispatch).toHaveBeenCalled();
  });

  it('should dispatch LoadTasks on refreshTasks', () => {
    component.refreshTasks();
    expect(storeMock.dispatch).toHaveBeenCalledWith(new LoadTasks());
  });
});
