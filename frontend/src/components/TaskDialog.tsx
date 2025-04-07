import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  created_at: string;
}

export interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onCreate: (taskData: Omit<Task, 'id' | 'created_at'>) => void;
  onUpdate: (taskId: string, data: Partial<Task>) => void;
}

export function TaskDialog({ isOpen, onClose, task, onCreate, onUpdate }: TaskDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const status = formData.get('status') as Task['status'];

    try {
      if (task) {
        onUpdate(task.id, {
          title,
          description,
          status,
        });
      } else {
        onCreate({
          title,
          description,
          status: 'TODO',
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="min-h-screen px-4 text-center">
        <div className="fixed inset-0 bg-black opacity-30" />
        <span
          className="inline-block h-screen align-middle"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <Dialog.Title
            as="h3"
            className="text-lg font-medium leading-6 text-gray-900"
          >
            {task ? 'Edit Task' : 'Create Task'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Input
              label="Title"
              name="title"
              defaultValue={task?.title}
              required
              placeholder="Enter task title"
            />

            <Input
              label="Description"
              name="description"
              defaultValue={task?.description}
              required
              placeholder="Enter task description"
            />

            {task && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={task.status}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
              >
                {task ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}
