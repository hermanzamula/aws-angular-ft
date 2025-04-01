import { TaskRequest } from '../../../../../shared/models/task';

export class SubmitTask {
  static readonly type = '[Task] Submit';
  constructor(public payload: TaskRequest) {}
}

export class LoadTasks {
  static readonly type = '[Task] Load All';
}
