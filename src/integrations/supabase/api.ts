import { supabase } from './client';
import { Checklist, Dropdown, Task, User } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// User functions
export async function getCurrentUser(): Promise<User | null> {
  const { data: session } = await supabase.auth.getSession();
  
  if (!session.session) return null;
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.session.user.id)
    .single();
  
  if (error || !data) return null;
  
  return {
    id: data.id,
    email: data.email,
    role: data.role as 'admin' | 'user'
  };
}

// Checklist functions
export async function getChecklists(): Promise<Checklist[]> {
  const { data: checklistsData, error: checklistsError } = await supabase
    .from('checklists')
    .select('*');
  
  if (checklistsError || !checklistsData) return [];
  
  const checklists: Checklist[] = [];
  
  for (const checklistData of checklistsData) {
    // Get dropdowns for this checklist
    const { data: dropdownsData, error: dropdownsError } = await supabase
      .from('dropdowns')
      .select('*')
      .eq('checklist_id', checklistData.id)
      .is('parent_dropdown_id', null);
    
    if (dropdownsError || !dropdownsData) continue;
    
    const dropdowns: Dropdown[] = [];
    
    for (const dropdownData of dropdownsData) {
      const dropdown = await getDropdownWithTasksAndNested(dropdownData);
      if (dropdown) dropdowns.push(dropdown);
    }
    
    checklists.push({
      id: checklistData.id,
      title: checklistData.title,
      dropdowns
    });
  }
  
  return checklists;
}

async function getDropdownWithTasksAndNested(dropdownData: any): Promise<Dropdown | null> {
  // Get tasks for this dropdown
  const { data: tasksData, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('dropdown_id', dropdownData.id);
  
  if (tasksError) return null;
  
  const tasks: Task[] = [];
  
  // Get the current user
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  
  // For each task, get the user-specific completion status
  for (const taskData of tasksData || []) {
    // Check if user has a completion record for this task
    const { data: completionData, error: completionError } = await supabase
      .from('user_task_completions')
      .select('completed')
      .eq('task_id', taskData.id)
      .eq('user_id', userData.user.id)
      .maybeSingle();
    
    // Use user-specific completion status if available, otherwise use the default
    const isCompleted = completionData ? completionData.completed : taskData.default_completed;
    
    tasks.push({
      id: taskData.id,
      title: taskData.title,
      completed: isCompleted,
      content: {
        subheader: taskData.content_subheader,
        content: taskData.content_text
      }
    });
  }
  
  // Get nested dropdowns
  const { data: nestedDropdownsData, error: nestedDropdownsError } = await supabase
    .from('dropdowns')
    .select('*')
    .eq('parent_dropdown_id', dropdownData.id);
  
  if (nestedDropdownsError) return null;
  
  const nestedDropdowns: Dropdown[] = [];
  
  for (const nestedDropdownData of nestedDropdownsData || []) {
    const nestedDropdown = await getDropdownWithTasksAndNested(nestedDropdownData);
    if (nestedDropdown) nestedDropdowns.push(nestedDropdown);
  }
  
  return {
    id: dropdownData.id,
    title: dropdownData.title,
    expanded: dropdownData.expanded,
    tasks,
    ...(nestedDropdowns.length > 0 ? { dropdowns: nestedDropdowns } : {})
  };
}

export async function createChecklist(checklist: Omit<Checklist, 'id'>): Promise<Checklist | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  
  // Get the current user to check if they're an admin
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single();
  
  const isAdmin = currentUser?.role === 'admin';
  
  const { data, error } = await supabase
    .from('checklists')
    .insert([{ 
      title: checklist.title,
      user_id: userData.user.id,
      is_global: isAdmin // Set is_global to true for admin users
    }])
    .select()
    .single();
  
  if (error || !data) return null;
  
  // Create dropdowns
  for (const dropdown of checklist.dropdowns) {
    await createDropdown(data.id, dropdown);
  }
  
  return getChecklistById(data.id);
}

export async function getChecklistById(id: string): Promise<Checklist | null> {
  const { data, error } = await supabase
    .from('checklists')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) return null;
  
  // Get dropdowns for this checklist
  const { data: dropdownsData, error: dropdownsError } = await supabase
    .from('dropdowns')
    .select('*')
    .eq('checklist_id', data.id)
    .is('parent_dropdown_id', null);
  
  if (dropdownsError || !dropdownsData) return null;
  
  const dropdowns: Dropdown[] = [];
  
  for (const dropdownData of dropdownsData) {
    const dropdown = await getDropdownWithTasksAndNested(dropdownData);
    if (dropdown) dropdowns.push(dropdown);
  }
  
  return {
    id: data.id,
    title: data.title,
    dropdowns
  };
}

export async function updateChecklist(checklist: Checklist): Promise<Checklist | null> {
  // Get the current user to check if they're an admin
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single();
  
  const isAdmin = currentUser?.role === 'admin';
  
  const { error } = await supabase
    .from('checklists')
    .update({ 
      title: checklist.title,
      is_global: isAdmin // Ensure admin checklists stay global
    })
    .eq('id', checklist.id);
  
  if (error) return null;
  
  return getChecklistById(checklist.id);
}

export async function deleteChecklist(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('checklists')
    .delete()
    .eq('id', id);
  
  return !error;
}

// Dropdown functions
export async function createDropdown(
  checklistId: string, 
  dropdown: Omit<Dropdown, 'id'>, 
  parentDropdownId?: string
): Promise<Dropdown | null> {
  const { data, error } = await supabase
    .from('dropdowns')
    .insert([{
      title: dropdown.title,
      checklist_id: checklistId,
      parent_dropdown_id: parentDropdownId || null,
      expanded: dropdown.expanded
    }])
    .select()
    .single();
  
  if (error || !data) return null;
  
  // Create tasks
  for (const task of dropdown.tasks) {
    await createTask(data.id, task);
  }
  
  // Create nested dropdowns
  if (dropdown.dropdowns) {
    for (const nestedDropdown of dropdown.dropdowns) {
      await createDropdown(checklistId, nestedDropdown, data.id);
    }
  }
  
  return getDropdownWithTasksAndNested(data);
}

export async function updateDropdown(dropdown: Dropdown): Promise<Dropdown | null> {
  const { error } = await supabase
    .from('dropdowns')
    .update({ title: dropdown.title, expanded: dropdown.expanded })
    .eq('id', dropdown.id);
  
  if (error) return null;
  
  const { data } = await supabase
    .from('dropdowns')
    .select('*')
    .eq('id', dropdown.id)
    .single();
  
  if (!data) return null;
  
  return getDropdownWithTasksAndNested(data);
}

export async function deleteDropdown(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('dropdowns')
    .delete()
    .eq('id', id);
  
  return !error;
}

export async function toggleDropdownExpanded(id: string, expanded: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('dropdowns')
    .update({ expanded })
    .eq('id', id);
  
  return !error;
}

// Task functions
export async function createTask(dropdownId: string, task: Omit<Task, 'id'>): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      title: task.title,
      completed: task.completed, // Keep for backward compatibility
      default_completed: task.completed, // Set default completion status
      content_subheader: task.content.subheader,
      content_text: task.content.content,
      dropdown_id: dropdownId
    }])
    .select()
    .single();
  
  if (error || !data) return null;
  
  // Get the current user
  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) {
    // Create a user-specific completion record if user is logged in
    await supabase
      .from('user_task_completions')
      .insert([{
        user_id: userData.user.id,
        task_id: data.id,
        completed: task.completed
      }]);
  }
  
  return {
    id: data.id,
    title: data.title,
    completed: task.completed,
    content: {
      subheader: data.content_subheader,
      content: data.content_text
    }
  };
}

export async function updateTask(task: Task): Promise<Task | null> {
  // Get user role to check if admin
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  
  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single();
  
  const isAdmin = userRole?.role === 'admin';
  
  // If admin, update the task content
  if (isAdmin) {
    const { error } = await supabase
      .from('tasks')
      .update({
        title: task.title,
        default_completed: task.completed, // Update default completion status
        content_subheader: task.content.subheader,
        content_text: task.content.content
      })
      .eq('id', task.id);
    
    if (error) return null;
  }
  
  // Update user-specific completion status
  const { data: existingCompletion } = await supabase
    .from('user_task_completions')
    .select('id')
    .eq('task_id', task.id)
    .eq('user_id', userData.user.id)
    .maybeSingle();
  
  if (existingCompletion) {
    // Update existing completion record
    await supabase
      .from('user_task_completions')
      .update({ completed: task.completed })
      .eq('id', existingCompletion.id);
  } else {
    // Create new completion record
    await supabase
      .from('user_task_completions')
      .insert([{
        user_id: userData.user.id,
        task_id: task.id,
        completed: task.completed
      }]);
  }
  
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', task.id)
    .single();
  
  if (!data) return null;
  
  return {
    id: data.id,
    title: data.title,
    completed: task.completed, // Use the passed completion status
    content: {
      subheader: data.content_subheader,
      content: data.content_text
    }
  };
}

export async function deleteTask(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  
  return !error;
}

export async function toggleTaskCompletion(id: string, completed: boolean): Promise<boolean> {
  // Get the current user
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;
  
  // Check if there's an existing completion record
  const { data: existingCompletion } = await supabase
    .from('user_task_completions')
    .select('id')
    .eq('task_id', id)
    .eq('user_id', userData.user.id)
    .maybeSingle();
  
  if (existingCompletion) {
    // Update existing completion record
    const { error } = await supabase
      .from('user_task_completions')
      .update({ completed })
      .eq('id', existingCompletion.id);
    
    return !error;
  } else {
    // Create new completion record
    const { error } = await supabase
      .from('user_task_completions')
      .insert([{
        user_id: userData.user.id,
        task_id: id,
        completed
      }]);
    
    return !error;
  }
} 