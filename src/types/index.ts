
export interface TaskContent {
  subheader: string;
  content: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  content: TaskContent;
}

export interface Dropdown {
  id: string;
  title: string;
  tasks: Task[];
  dropdowns?: Dropdown[]; // For nested dropdowns
  expanded: boolean;
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
