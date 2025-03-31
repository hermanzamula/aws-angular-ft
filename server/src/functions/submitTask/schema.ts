export default {
  type: 'object',
  properties: {
    taskId: { type: 'string' },
    answer: { type: 'string' }
  },
  required: ['taskId', 'answer']
} as const;
