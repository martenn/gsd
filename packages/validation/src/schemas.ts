import { z } from 'zod';

export const listNameSchema = z.string().min(1, 'List name is required').max(100, 'List name too long');

export const taskTitleSchema = z.string().min(1, 'Task title is required').max(500, 'Task title too long');

export const taskDescriptionSchema = z
  .string()
  .max(5000, 'Description too long')
  .optional()
  .or(z.literal(''));

export const createListSchema = z.object({
  name: listNameSchema,
  isBacklog: z.boolean().optional(),
});

export const updateListSchema = z.object({
  name: listNameSchema,
});

export const createTaskSchema = z.object({
  title: taskTitleSchema,
  description: taskDescriptionSchema,
});

export const updateTaskSchema = z.object({
  title: taskTitleSchema,
  description: taskDescriptionSchema,
});

export const bulkAddTasksSchema = z.object({
  taskLines: z
    .string()
    .min(1, 'Please enter at least one task')
    .refine(
      (value) => {
        const lines = value.split('\n').filter((line) => line.trim() !== '');
        return lines.length <= 10;
      },
      { message: 'Maximum 10 tasks allowed' },
    )
    .refine(
      (value) => {
        const lines = value.split('\n').filter((line) => line.trim() !== '');
        return lines.every((line) => line.length <= 500);
      },
      { message: 'Each task title must be 500 characters or less' },
    ),
  targetListId: z.string().min(1, 'Please select a backlog'),
});

export type CreateListData = z.infer<typeof createListSchema>;
export type UpdateListData = z.infer<typeof updateListSchema>;
export type CreateTaskData = z.infer<typeof createTaskSchema>;
export type UpdateTaskData = z.infer<typeof updateTaskSchema>;
export type BulkAddTasksData = z.infer<typeof bulkAddTasksSchema>;
