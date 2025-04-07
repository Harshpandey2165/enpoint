"use client";

import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Task } from './types';
import { Button } from '@/components/ui/Button';
import { TaskDialog } from '@/components/TaskDialog';

interface FetchTasksResponse {
  tasks: Task[];
}

const fetchTasks = async (): Promise<FetchTasksResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return response.json();
};

const useTasksQuery = () => {
  return useQuery({
    queryKey: ['tasks'] as const,
    queryFn: fetchTasks,
    select: (data: FetchTasksResponse) => data.tasks,
    enabled: !!localStorage.getItem('token'),
    retry: 1,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskData: Omit<Task, 'id' | 'created_at'>) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] as const });
    }
  });
};

const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: Task['status'] }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] as const });
    }
  });
};

const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] as const });
    }
  });
};

export function TasksClient() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data: tasks = [], error: fetchError, isLoading } = useTasksQuery();
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedTask(undefined);
  };

  const handleTaskCreate = (taskData: Omit<Task, 'id' | 'created_at'>) => {
    createTaskMutation.mutate(taskData);
    handleDialogClose();
  };

  const handleTaskUpdate = (taskId: string, status: Task['status']) => {
    updateTaskMutation.mutate({ taskId, status });
  };

  const handleTaskDelete = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (fetchError) {
    return <div>Error: {fetchError.message}</div>;
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => {
        setSelectedTask(undefined);
        setIsDialogOpen(true);
      }}>Create Task</Button>
      
      <TaskDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        task={selectedTask}
        onTaskCreated={handleTaskCreate}
        onTaskUpdated={handleTaskUpdate}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={() => handleTaskClick(task)}
          >
            <h3 className="font-semibold">{task.title}</h3>
            <p className="text-gray-600">{task.description}</p>
            <span className={`px-2 py-1 rounded-full text-sm ${
              task.status === 'TODO' ? 'bg-blue-100 text-blue-800' :
              task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {task.status}
            </span>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => handleTaskClick(task)}
                className="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                onClick={() => handleTaskDelete(task.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
