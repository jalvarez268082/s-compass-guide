import { supabase } from './client';
import { Checklist, Dropdown, Task, User, LearningPage } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Add this function at the beginning of the file after imports
export async function hasValidSession(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    return !error && data.session !== null;
  } catch (err) {
    console.error('Error checking session:', err);
    return false;
  }
}

// User functions
export async function getCurrentUser(): Promise<User | null> {
  try {
    // Check if we have a valid session first
    const hasSession = await hasValidSession();
    if (!hasSession) {
      console.log('No valid session found');
      return null;
    }
    
    // Get user from auth
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      console.error('Error getting current user:', authError ? authError.message : 'Auth session missing!');
      return null;
    }
    
    // Get user from database
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (!userData) {
      // Return basic user from auth data if database record doesn't exist
      return {
        id: authData.user.id,
        email: authData.user.email || '',
        role: 'user' // Default role
      };
    }
    
    return {
      id: userData.id,
      email: userData.email,
      role: userData.role as 'admin' | 'user'
    };
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
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

// First, I'll add a SupabaseDropdown type definition to fix the missing type error
/**
 * Database representation of a dropdown
 */
interface SupabaseDropdown {
  id: string;
  title: string;
  expanded: boolean;
  checklist_id: string;
  parent_dropdown_id: string | null;
  position: number;
  created_at?: string;
  updated_at?: string;
}

export async function getDropdownWithTasksAndNested(dropdown: SupabaseDropdown): Promise<Dropdown> {
  // Get tasks for dropdown
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('dropdown_id', dropdown.id);

  // Get nested dropdowns
  const { data: nestedDropdowns } = await supabase
    .from('dropdowns')
    .select('*')
    .eq('parent_dropdown_id', dropdown.id);

  // Get tasks and nested dropdowns for each nested dropdown
  const nestedWithTasks = await Promise.all(
    nestedDropdowns?.map((nestedDropdown) => getDropdownWithTasksAndNested(nestedDropdown)) || []
  );

  return {
    id: dropdown.id,
    title: dropdown.title,
    tasks: tasks?.map((task) => ({
      id: task.id,
      title: task.title,
      completed: task.completed,
      // Add default content property to match Task interface
      content: {
        subheader: task.content_subheader || task.title || '',
        content: task.content_text || ''
      }
    })) || [],
    dropdowns: nestedWithTasks || [],
    expanded: dropdown.expanded,
  };
}

export async function fetchDropdownsForChecklist(checklistId: string): Promise<Dropdown[]> {
  // Get top-level dropdowns
  const { data: dropdowns, error } = await supabase
    .from('dropdowns')
    .select('*')
    .eq('checklist_id', checklistId)
    .is('parent_dropdown_id', null);

  if (error) return [];

  // For each dropdown, get all tasks and nested dropdowns
  const dropdownsWithTasksAndNested = await Promise.all(
    dropdowns.map((dropdown) => getDropdownWithTasksAndNested(dropdown))
  );

  return dropdownsWithTasksAndNested;
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
    .is('parent_dropdown_id', null)
    .order('position', { ascending: true });
  
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
export async function createTask(
  dropdownId: string,
  task: Omit<Task, 'id'>
): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      title: task.title,
      completed: task.completed || false,
      dropdown_id: dropdownId,
      // Add default values for content fields
      content_subheader: task.content?.subheader || task.title || '',
      content_text: task.content?.content || ''
    }])
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    completed: data.completed,
    // Add content to match Task interface
    content: {
      subheader: data.content_subheader || data.title || '',
      content: data.content_text || ''
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

// Add new functions for updating positions
export async function updateDropdownPositions(dropdowns: Dropdown[]): Promise<boolean> {
  try {
    // Prepare batch updates
    const updates = dropdowns.map(dropdown => ({
      id: dropdown.id,
      position: dropdown.position || 0
    }));
    
    // Try batch update first
    const { error } = await supabase
      .from('dropdowns')
      .upsert(updates, { onConflict: 'id' });
    
    // If batch update succeeds, return true
    if (!error) return true;
    
    // If batch update fails due to permissions, try individual updates
    console.warn('Batch update failed, falling back to individual updates:', error.message);
    
    // Fallback: update each dropdown individually
    let allSuccessful = true;
    for (const dropdown of updates) {
      const { error: individualError } = await supabase
        .from('dropdowns')
        .update({ position: dropdown.position })
        .eq('id', dropdown.id);
      
      if (individualError) {
        console.error(`Failed to update dropdown ${dropdown.id}:`, individualError);
        allSuccessful = false;
      }
    }
    
    return allSuccessful;
  } catch (err) {
    console.error('Error updating dropdown positions:', err);
    return false;
  }
}

export async function updateTaskPositions(tasks: Task[]): Promise<boolean> {
  try {
    // Prepare batch updates
    const updates = tasks.map(task => ({
      id: task.id,
      position: task.position || 0
    }));
    
    // Try batch update first
    const { error } = await supabase
      .from('tasks')
      .upsert(updates, { onConflict: 'id' });
    
    // If batch update succeeds, return true
    if (!error) return true;
    
    // If batch update fails due to permissions, try individual updates
    console.warn('Batch update failed, falling back to individual updates:', error.message);
    
    // Fallback: update each task individually
    let allSuccessful = true;
    for (const task of updates) {
      const { error: individualError } = await supabase
        .from('tasks')
        .update({ position: task.position })
        .eq('id', task.id);
      
      if (individualError) {
        console.error(`Failed to update task ${task.id}:`, individualError);
        allSuccessful = false;
      }
    }
    
    return allSuccessful;
  } catch (err) {
    console.error('Error updating task positions:', err);
    return false;
  }
}

// Learning Pages functions
export async function getAllLearningPages(): Promise<LearningPage[]> {
  const { data, error } = await supabase
    .from('learning_pages')
    .select(`
      *,
      author:created_by(id, email, role)
    `)
    .order('title');
  
  if (error || !data) return [];
  
  return data.map(page => ({
    ...page,
    author: page.author ? {
      id: page.author.id,
      email: page.author.email,
      role: page.author.role as 'admin' | 'user'
    } : undefined
  }));
}

export async function getLearningPageById(id: string): Promise<LearningPage | null> {
  const { data, error } = await supabase
    .from('learning_pages')
    .select(`
      *,
      author:created_by(id, email, role)
    `)
    .eq('id', id)
    .single();
  
  if (error || !data) return null;
  
  return {
    ...data,
    author: data.author ? {
      id: data.author.id,
      email: data.author.email,
      role: data.author.role as 'admin' | 'user'
    } : undefined
  };
}

export async function createLearningPage(page: Omit<LearningPage, 'id' | 'created_at' | 'updated_at'>): Promise<LearningPage | null> {
  // Check if user is admin
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  
  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single();
  
  if (userRole?.role !== 'admin') {
    return null; // Only admins can create learning pages
  }
  
  // Create the learning page
  const { data, error } = await supabase
    .from('learning_pages')
    .insert([{
      title: page.title,
      content: page.content,
      created_by: userData.user.id
    }])
    .select()
    .single();
  
  if (error || !data) return null;
  
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    created_by: data.created_by,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

export async function updateLearningPage(page: LearningPage): Promise<LearningPage | null> {
  // Check if user is admin
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  
  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single();
  
  if (userRole?.role !== 'admin') {
    return null; // Only admins can update learning pages
  }
  
  // Update the learning page
  const { data, error } = await supabase
    .from('learning_pages')
    .update({
      title: page.title,
      content: page.content,
      updated_at: new Date().toISOString()
    })
    .eq('id', page.id)
    .select()
    .single();
  
  if (error || !data) return null;
  
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    created_by: data.created_by,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

export async function deleteLearningPage(id: string): Promise<boolean> {
  // Check if user is admin
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;
  
  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single();
  
  if (userRole?.role !== 'admin') {
    return false; // Only admins can delete learning pages
  }
  
  // Delete the learning page
  const { error } = await supabase
    .from('learning_pages')
    .delete()
    .eq('id', id);
  
  return !error;
}

// Task Learning Pages junction functions
export async function getLearningPagesForTask(taskId: string): Promise<LearningPage[]> {
  const { data, error } = await supabase
    .from('task_learning_pages')
    .select(`
      learning_page_id,
      learning_page:learning_page_id(
        id, 
        title, 
        content, 
        created_by, 
        created_at, 
        updated_at,
        author:created_by(id, email, role)
      )
    `)
    .eq('task_id', taskId);
  
  if (error || !data) return [];
  
  return data.map(item => ({
    id: item.learning_page.id,
    title: item.learning_page.title,
    content: item.learning_page.content,
    created_by: item.learning_page.created_by,
    created_at: item.learning_page.created_at,
    updated_at: item.learning_page.updated_at,
    author: item.learning_page.author ? {
      id: item.learning_page.author.id,
      email: item.learning_page.author.email,
      role: item.learning_page.author.role as 'admin' | 'user'
    } : undefined
  }));
}

export async function getTasksForLearningPage(learningPageId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('task_learning_pages')
    .select(`
      task_id,
      task:task_id(
        id, 
        title, 
        completed, 
        content_subheader, 
        content_text
      )
    `)
    .eq('learning_page_id', learningPageId);
  
  if (error || !data) return [];
  
  return data.map(item => ({
    id: item.task.id,
    title: item.task.title,
    completed: item.task.completed,
    content: {
      subheader: item.task.content_subheader,
      content: item.task.content_text
    }
  }));
}

export async function assignLearningPageToTask(taskId: string, learningPageId: string): Promise<boolean> {
  // Check if user is admin
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;
  
  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single();
  
  if (userRole?.role !== 'admin') {
    return false; // Only admins can assign learning pages to tasks
  }
  
  // Create the assignment
  const { error } = await supabase
    .from('task_learning_pages')
    .insert([{
      task_id: taskId,
      learning_page_id: learningPageId
    }]);
  
  return !error;
}

export async function removeLearningPageFromTask(taskId: string, learningPageId: string): Promise<boolean> {
  // Check if user is admin
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;
  
  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single();
  
  if (userRole?.role !== 'admin') {
    return false; // Only admins can remove learning pages from tasks
  }
  
  // Delete the assignment
  const { error } = await supabase
    .from('task_learning_pages')
    .delete()
    .eq('task_id', taskId)
    .eq('learning_page_id', learningPageId);
  
  return !error;
} 