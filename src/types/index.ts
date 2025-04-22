export interface TaskContent {
  subheader: string;
  content: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  content: TaskContent;
  position?: number;
}

export interface LearningPage {
  id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  author?: User; // Optional author details to be populated from the users table
}

export interface TaskLearningPage {
  id: string;
  task_id: string;
  learning_page_id: string;
  created_at: string;
  task?: Task; // Optional task details to be populated from the tasks table
  learning_page?: LearningPage; // Optional learning page details to be populated from the learning_pages table
}

export interface Dropdown {
  id: string;
  title: string;
  expanded: boolean;
  tasks: Task[];
  dropdowns: Dropdown[];
  position?: number;
}

export interface Checklist {
  id: string;
  title: string;
  dropdowns: Dropdown[];
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}
