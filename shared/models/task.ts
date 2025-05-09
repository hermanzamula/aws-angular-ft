export interface Task {
  taskId: string;
  answer: string;
  status: 'Pending' | 'Processed' | 'Failed';
  retries: number;
  errorMessage: string;
  createdAt?: string;
}

export interface TaskRequest {
  taskId: string;
  answer: string;
}
