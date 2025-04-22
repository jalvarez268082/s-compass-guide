import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task, Dropdown, Checklist, User, LearningPage } from '../types';
import * as api from '@/integrations/supabase/api';
import * as auth from '@/integrations/supabase/auth';

interface StoreContextType {
  currentUser: User | null;
  checklists: Checklist[];
  selectedTask: Task | null;
  referrerTask: Task | null;
  allTasks: Task[];
  isInfoModalOpen: boolean;
  isAdminEditMode: boolean;
  isLoading: boolean;
  error: string | null;
  authError: string | null;
  isAuthenticated: boolean;
  
  // User auth methods
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, isAdmin: boolean) => Promise<boolean>;
  signOut: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  
  setCurrentUser: (user: User | null) => void;
  setChecklists: (checklists: Checklist[]) => void;
  addChecklist: (checklist: Omit<Checklist, 'id'>) => Promise<void>;
  updateChecklist: (checklist: Checklist) => Promise<void>;
  deleteChecklist: (checklistId: string) => Promise<void>;
  toggleDropdown: (checklistId: string, dropdownId: string) => Promise<void>;
  addDropdown: (checklistId: string, dropdown: Omit<Dropdown, 'id'>, parentDropdownId?: string) => Promise<void>;
  updateDropdown: (checklistId: string, dropdown: Dropdown, parentDropdownId?: string) => Promise<void>;
  deleteDropdown: (checklistId: string, dropdownId: string, parentDropdownId?: string) => Promise<void>;
  toggleTaskCompletion: (checklistId: string, dropdownId: string, taskId: string) => Promise<void>;
  addTask: (checklistId: string, dropdownId: string, task: Omit<Task, 'id'>, parentDropdownId?: string) => Promise<void>;
  updateTask: (checklistId: string, dropdownId: string, task: Task, parentDropdownId?: string) => Promise<void>;
  deleteTask: (checklistId: string, dropdownId: string, taskId: string, parentDropdownId?: string) => Promise<void>;
  openInfoModal: (task: Task, referrer?: Task) => void;
  closeInfoModal: () => void;
  navigateBackToReferrer: () => void;
  refreshData: () => Promise<void>;
  
  // Add new reordering methods
  reorderDropdowns: (checklistId: string, dropdowns: Dropdown[]) => Promise<void>;
  reorderNestedDropdowns: (parentDropdownId: string, dropdowns: Dropdown[]) => Promise<void>;
  reorderTasks: (dropdownId: string, tasks: Task[]) => Promise<void>;

  learningPages: LearningPage[];
  selectedLearningPage: LearningPage | null;
  isLearningPageModalOpen: boolean;
  fetchLearningPages: () => Promise<void>;
  fetchLearningPagesForTask: (taskId: string) => Promise<LearningPage[]>;
  createLearningPage: (page: Omit<LearningPage, 'id' | 'created_at' | 'updated_at' | 'author'>) => Promise<LearningPage | null>;
  updateLearningPage: (page: LearningPage) => Promise<LearningPage | null>;
  deleteLearningPage: (id: string) => Promise<boolean>;
  assignLearningPageToTask: (taskId: string, learningPageId: string) => Promise<boolean>;
  removeLearningPageFromTask: (taskId: string, learningPageId: string) => Promise<boolean>;
  openLearningPageModal: (page: LearningPage | null) => void;
  closeLearningPageModal: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [referrerTask, setReferrerTask] = useState<Task | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isAdminEditMode, setIsAdminEditMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [learningPages, setLearningPages] = useState<LearningPage[]>([]);
  const [selectedLearningPage, setSelectedLearningPage] = useState<LearningPage | null>(null);
  const [isLearningPageModalOpen, setIsLearningPageModalOpen] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  // Helper function to find dropdown by id (either at top level or nested)
  const findDropdown = (dropdowns: Dropdown[], id: string): Dropdown | null => {
    for (const dropdown of dropdowns) {
      if (dropdown.id === id) return dropdown;
      if (dropdown.dropdowns) {
        const nestedResult = findDropdown(dropdown.dropdowns, id);
        if (nestedResult) return nestedResult;
      }
    }
    return null;
  };

  // Helper function to get a checklist by id
  const getChecklist = (id: string): Checklist | null => {
    return checklists.find(c => c.id === id) || null;
  };

  // Method to extract all tasks from the checklist structure
  const extractAllTasks = useCallback((checklists: Checklist[]): Task[] => {
    const tasks: Task[] = [];
    
    const processDropdown = (dropdown: Dropdown) => {
      // Add tasks from current dropdown
      tasks.push(...dropdown.tasks);
      
      // Process nested dropdowns if they exist
      if (dropdown.dropdowns && dropdown.dropdowns.length > 0) {
        dropdown.dropdowns.forEach(nestedDropdown => {
          processDropdown(nestedDropdown);
        });
      }
    };
    
    // Process all checklists
    checklists.forEach(checklist => {
      checklist.dropdowns.forEach(dropdown => {
        processDropdown(dropdown);
      });
    });
    
    return tasks;
  }, []);

  // Update allTasks whenever checklists are updated
  useEffect(() => {
    if (checklists.length > 0) {
      const tasks = extractAllTasks(checklists);
      setAllTasks(tasks);
    }
  }, [checklists, extractAllTasks]);

  // Authentication methods
  const signIn = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);
    
    try {
      const { user, error: signInError } = await auth.signIn(email, password);
      
      if (signInError) {
        setAuthError(signInError);
        return false;
      }
      
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        // If user is admin, automatically enable admin mode
        if (user.role === 'admin') {
          setIsAdminEditMode(true);
        }
        return true;
      }
      
      return false;
    } catch (err) {
      console.error(err);
      setAuthError('An unexpected error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const signUp = async (email: string, password: string, isAdmin: boolean): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);
    
    try {
      const { user, error: signUpError } = await auth.signUp(email, password, isAdmin);
      
      if (signUpError) {
        setAuthError(signUpError);
        return false;
      }
      
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        // If user is admin, automatically enable admin mode
        if (user.role === 'admin') {
          setIsAdminEditMode(true);
        }
        return true;
      }
      
      return false;
    } catch (err) {
      console.error(err);
      setAuthError('An unexpected error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const signOutUser = async (): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);
    
    try {
      const { error: signOutError } = await auth.signOut();
      
      if (signOutError) {
        setAuthError(signOutError);
        return false;
      }
      
      setCurrentUser(null);
      setIsAuthenticated(false);
      setIsAdminEditMode(false);
      return true;
    } catch (err) {
      console.error(err);
      setAuthError('An unexpected error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetPassword = async (email: string): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);
    
    try {
      const { success, error: resetError } = await auth.resetPassword(email);
      
      if (resetError) {
        setAuthError(resetError);
        return false;
      }
      
      return success;
    } catch (err) {
      console.error(err);
      setAuthError('An unexpected error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if we have a valid session first
      const hasSession = await auth.hasValidSession();
      if (!hasSession) {
        console.log('No valid session found during initial load');
        setCurrentUser(null);
        setIsAuthenticated(false);
        setChecklists([]);
        setIsLoading(false);
        return;
      }
      
      // Get current user from auth
      const { user, error: userError } = await auth.getCurrentUser();
      
      if (userError) {
        console.error('Error getting current user:', userError);
        setIsAuthenticated(false);
        setCurrentUser(null);
        setChecklists([]);
        setIsLoading(false);
        return;
      }
      
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        // If user is admin, automatically enable admin mode
        if (user.role === 'admin') {
          setIsAdminEditMode(true);
        }
        
        try {
          // Get checklists
          const checklistsData = await api.getChecklists();
          setChecklists(checklistsData);
        } catch (checklistError) {
          console.error('Error fetching checklists:', checklistError);
          setError('Failed to load checklists');
          setChecklists([]);
        }
      } else {
        // Not authenticated, clear data
        setIsAuthenticated(false);
        setCurrentUser(null);
        setChecklists([]);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Unexpected error during initial load:', err);
      // Reset state on error
      setIsAuthenticated(false);
      setCurrentUser(null);
      setChecklists([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload data
  const refreshData = async () => {
    try {
      setIsLoading(true);
      if (isAuthenticated) {
        const checklistsData = await api.getChecklists();
        setChecklists(checklistsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on initial mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Actions
  const addChecklist = async (checklist: Omit<Checklist, 'id'>) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const newChecklist = await api.createChecklist(checklist);
      if (newChecklist) {
        setChecklists(prev => [...prev, newChecklist]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateChecklist = async (checklist: Checklist) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const updatedChecklist = await api.updateChecklist(checklist);
      if (updatedChecklist) {
        setChecklists(prev => prev.map(c => c.id === updatedChecklist.id ? updatedChecklist : c));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChecklist = async (checklistId: string) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const success = await api.deleteChecklist(checklistId);
      if (success) {
        setChecklists(prev => prev.filter(c => c.id !== checklistId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDropdown = async (checklistId: string, dropdownId: string) => {
    if (!isAuthenticated) return;
    
    try {
      // Find the checklist
      const checklist = getChecklist(checklistId);
      if (!checklist) return;
      
      // Find the dropdown
      const dropdown = findDropdown(checklist.dropdowns, dropdownId);
      if (!dropdown) return;
      
      // Toggle expanded state in DB
      const success = await api.toggleDropdownExpanded(dropdownId, !dropdown.expanded);
      
      if (success) {
        // Update local state
    setChecklists(prev => 
          prev.map(c => {
            if (c.id !== checklistId) return c;
            
            // Update dropdowns
            const updateNestedDropdown = (dropdowns: Dropdown[]): Dropdown[] => {
              return dropdowns.map(d => {
                if (d.id === dropdownId) {
                  return { ...d, expanded: !d.expanded };
                }
                
                if (d.dropdowns) {
                  return { ...d, dropdowns: updateNestedDropdown(d.dropdowns) };
                }
                
                return d;
              });
            };
            
            return { ...c, dropdowns: updateNestedDropdown(c.dropdowns) };
          })
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addDropdown = async (checklistId: string, dropdown: Omit<Dropdown, 'id'>, parentDropdownId?: string) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const newDropdown = await api.createDropdown(checklistId, dropdown, parentDropdownId);
      
      if (newDropdown) {
        // Refresh data to get updated structure
        await refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDropdown = async (checklistId: string, dropdown: Dropdown, parentDropdownId?: string) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const updatedDropdown = await api.updateDropdown(dropdown);
      
      if (updatedDropdown) {
        // Refresh data to get updated structure
        await refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDropdown = async (checklistId: string, dropdownId: string, parentDropdownId?: string) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const success = await api.deleteDropdown(dropdownId);
      
      if (success) {
        // Refresh data to get updated structure
        await refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskCompletion = async (checklistId: string, dropdownId: string, taskId: string) => {
    if (!isAuthenticated) return;
    
    try {
      // Find the checklist
      const checklist = getChecklist(checklistId);
      if (!checklist) return;
      
      // Find the dropdown
      const dropdown = findDropdown(checklist.dropdowns, dropdownId);
      if (!dropdown) return;
      
      // Find the task
      const task = dropdown.tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Toggle completion state in DB
      const success = await api.toggleTaskCompletion(taskId, !task.completed);
      
      if (success) {
        // Update local state
    setChecklists(prev => 
          prev.map(c => {
            if (c.id !== checklistId) return c;
            
            // Update dropdowns
            const updateNestedDropdownTasks = (dropdowns: Dropdown[]): Dropdown[] => {
              return dropdowns.map(d => {
                if (d.id === dropdownId) {
            return {
                    ...d, 
                    tasks: d.tasks.map(t => 
                      t.id === taskId ? { ...t, completed: !t.completed } : t
                    ) 
                  };
                }
                
                if (d.dropdowns) {
                  return { ...d, dropdowns: updateNestedDropdownTasks(d.dropdowns) };
                }
                
                return d;
              });
            };
            
            return { ...c, dropdowns: updateNestedDropdownTasks(c.dropdowns) };
          })
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addTask = async (checklistId: string, dropdownId: string, task: Omit<Task, 'id'>, parentDropdownId?: string) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const newTask = await api.createTask(dropdownId, task);
      
      if (newTask) {
        // Refresh data to get updated structure
        await refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (checklistId: string, dropdownId: string, task: Task, parentDropdownId?: string) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const updatedTask = await api.updateTask(task);
      
      if (updatedTask) {
        // Refresh data to get updated structure
        await refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (checklistId: string, dropdownId: string, taskId: string, parentDropdownId?: string) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const success = await api.deleteTask(taskId);
      
      if (success) {
        // Refresh data to get updated structure
        await refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openInfoModal = (task: Task, referrer?: Task) => {
    setSelectedTask(task);
    if (referrer) {
      setReferrerTask(referrer);
    } else {
      setReferrerTask(null);
    }
    setIsInfoModalOpen(true);
  };

  const closeInfoModal = () => {
    setIsInfoModalOpen(false);
    setSelectedTask(null);
    // Do not clear referrer task here to allow for possible back navigation
  };

  const navigateBackToReferrer = () => {
    if (referrerTask) {
      setSelectedTask(referrerTask);
      setReferrerTask(null); // Clear the referrer after navigation
    } else {
      closeInfoModal();
    }
  };

  // Setup click handler for task links
  useEffect(() => {
    const handleTaskLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.task-link')) {
        e.preventDefault();
        const link = target.closest('.task-link') as HTMLElement;
        const taskId = link.getAttribute('data-task-id');
        
        if (taskId) {
          // Find the task
          const foundTask = allTasks.find(t => t.id === taskId);
          if (foundTask && selectedTask) {
            openInfoModal(foundTask, selectedTask);
          }
        }
      }
    };

    document.addEventListener('click', handleTaskLinkClick);
    return () => {
      document.removeEventListener('click', handleTaskLinkClick);
    };
  }, [allTasks, selectedTask]);

  // Add the implementation of the reordering methods
  const reorderDropdowns = async (checklistId: string, dropdowns: Dropdown[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the API to update positions in the database
      const success = await api.updateDropdownPositions(dropdowns);
      
      if (success) {
        // Update the local state with the new ordering
        setChecklists(prev => {
          return prev.map(checklist => {
            if (checklist.id === checklistId) {
              return {
                ...checklist,
                dropdowns: dropdowns.map(dropdown => {
                  // Find the original dropdown to preserve nested data
                  const originalDropdown = checklist.dropdowns.find(d => d.id === dropdown.id);
                  if (originalDropdown) {
                    return {
                      ...originalDropdown,
                      position: dropdown.position
                    };
                  }
                  return dropdown;
                })
              };
            }
            return checklist;
          });
        });
      } else {
        setError('Failed to update dropdown positions');
      }
    } catch (err) {
      console.error('Error reordering dropdowns:', err);
      setError('An error occurred while reordering dropdowns');
    } finally {
      setIsLoading(false);
    }
  };

  const reorderNestedDropdowns = async (parentDropdownId: string, dropdowns: Dropdown[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the API to update positions in the database
      const success = await api.updateDropdownPositions(dropdowns);
      
      if (success) {
        // Update the local state with the new ordering
        setChecklists(prev => {
          return prev.map(checklist => {
            return {
              ...checklist,
              dropdowns: checklist.dropdowns.map(dropdown => {
                if (dropdown.id === parentDropdownId && dropdown.dropdowns) {
                  return {
                    ...dropdown,
                    dropdowns: dropdowns.map(nestedDropdown => {
                      // Find the original dropdown to preserve nested data
                      const originalDropdown = dropdown.dropdowns?.find(d => d.id === nestedDropdown.id);
                      if (originalDropdown) {
                        return {
                          ...originalDropdown,
                          position: nestedDropdown.position
                        };
                      }
                      return nestedDropdown;
                    })
                  };
                }
                
                // Check for deeper nesting
                if (dropdown.dropdowns && dropdown.dropdowns.length > 0) {
                  return {
                    ...dropdown,
                    dropdowns: updateNestedDropdowns(dropdown.dropdowns, parentDropdownId, dropdowns)
                  };
                }
                
                return dropdown;
              })
            };
          });
        });
      } else {
        setError('Failed to update nested dropdown positions');
      }
    } catch (err) {
      console.error('Error reordering nested dropdowns:', err);
      setError('An error occurred while reordering nested dropdowns');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to recursively update nested dropdowns
  const updateNestedDropdowns = (
    dropdowns: Dropdown[], 
    parentDropdownId: string, 
    reorderedDropdowns: Dropdown[]
  ): Dropdown[] => {
    return dropdowns.map(dropdown => {
      if (dropdown.id === parentDropdownId && dropdown.dropdowns) {
        return {
          ...dropdown,
          dropdowns: reorderedDropdowns.map(nestedDropdown => {
            const originalDropdown = dropdown.dropdowns?.find(d => d.id === nestedDropdown.id);
            if (originalDropdown) {
              return {
                ...originalDropdown,
                position: nestedDropdown.position
              };
            }
            return nestedDropdown;
          })
        };
      }
      
      if (dropdown.dropdowns && dropdown.dropdowns.length > 0) {
        return {
          ...dropdown,
          dropdowns: updateNestedDropdowns(dropdown.dropdowns, parentDropdownId, reorderedDropdowns)
        };
      }
      
      return dropdown;
    });
  };

  const reorderTasks = async (dropdownId: string, tasks: Task[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the API to update positions in the database
      const success = await api.updateTaskPositions(tasks);
      
      if (success) {
        // Update the local state with the new ordering
        setChecklists(prev => {
          return prev.map(checklist => {
            return {
              ...checklist,
              dropdowns: updateDropdownTasks(checklist.dropdowns, dropdownId, tasks)
            };
          });
        });
      } else {
        setError('Failed to update task positions');
      }
    } catch (err) {
      console.error('Error reordering tasks:', err);
      setError('An error occurred while reordering tasks');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to recursively update tasks in dropdowns
  const updateDropdownTasks = (
    dropdowns: Dropdown[], 
    targetDropdownId: string, 
    reorderedTasks: Task[]
  ): Dropdown[] => {
    return dropdowns.map(dropdown => {
      if (dropdown.id === targetDropdownId) {
        return {
          ...dropdown,
          tasks: reorderedTasks
        };
      }
      
      if (dropdown.dropdowns && dropdown.dropdowns.length > 0) {
        return {
          ...dropdown,
          dropdowns: updateDropdownTasks(dropdown.dropdowns, targetDropdownId, reorderedTasks)
        };
      }
      
      return dropdown;
    });
  };

  // Learning Pages functions
  const fetchLearningPages = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const pages = await api.getAllLearningPages();
      setLearningPages(pages);
    } catch (err) {
      console.error('Error fetching learning pages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLearningPagesForTask = async (taskId: string): Promise<LearningPage[]> => {
    if (!isAuthenticated) return [];
    
    try {
      return await api.getLearningPagesForTask(taskId);
    } catch (err) {
      console.error('Error fetching learning pages for task:', err);
      return [];
    }
  };

  const createLearningPage = async (page: Omit<LearningPage, 'id' | 'created_at' | 'updated_at' | 'author'>) => {
    if (!isAuthenticated || !isAdmin) return null;
    
    try {
      setIsLoading(true);
      const newPage = await api.createLearningPage(page);
      
      if (newPage) {
        // Refresh learning pages
        await fetchLearningPages();
        return newPage;
      }
      return null;
    } catch (err) {
      console.error('Error creating learning page:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLearningPage = async (page: LearningPage) => {
    if (!isAuthenticated || !isAdmin) return null;
    
    try {
      setIsLoading(true);
      const updatedPage = await api.updateLearningPage(page);
      
      if (updatedPage) {
        // Refresh learning pages
        await fetchLearningPages();
        return updatedPage;
      }
      return null;
    } catch (err) {
      console.error('Error updating learning page:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLearningPage = async (id: string) => {
    if (!isAuthenticated || !isAdmin) return false;
    
    try {
      setIsLoading(true);
      const success = await api.deleteLearningPage(id);
      
      if (success) {
        // Refresh learning pages
        await fetchLearningPages();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting learning page:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const assignLearningPageToTask = async (taskId: string, learningPageId: string) => {
    if (!isAuthenticated || !isAdmin) return false;
    
    try {
      setIsLoading(true);
      const success = await api.assignLearningPageToTask(taskId, learningPageId);
      
      if (success) {
        // No need to refresh entire state as this doesn't affect main checklist structure
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error assigning learning page to task:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeLearningPageFromTask = async (taskId: string, learningPageId: string) => {
    if (!isAuthenticated || !isAdmin) return false;
    
    try {
      setIsLoading(true);
      const success = await api.removeLearningPageFromTask(taskId, learningPageId);
      
      if (success) {
        // No need to refresh entire state as this doesn't affect main checklist structure
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error removing learning page from task:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const openLearningPageModal = (page: LearningPage | null = null) => {
    setSelectedLearningPage(page);
    setIsLearningPageModalOpen(true);
  };

  const closeLearningPageModal = () => {
    setIsLearningPageModalOpen(false);
    setSelectedLearningPage(null);
  };

  // Initialization and side effects
  useEffect(() => {
    if (isAuthenticated) {
      // Load checklists when authenticated
      fetchChecklists();
      // Also load learning pages
      fetchLearningPages();
    }
  }, [isAuthenticated]);

  // Add fetchChecklists function if it doesn't exist
  const fetchChecklists = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const userChecklists = await api.getChecklists();
      setChecklists(userChecklists);
    } catch (err) {
      console.error('Error fetching checklists:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        checklists,
        selectedTask,
        referrerTask,
        allTasks,
        isInfoModalOpen,
        isAdminEditMode,
        isLoading,
        error,
        authError,
        isAuthenticated,
        signIn,
        signUp,
        signOut: signOutUser,
        resetPassword,
        setCurrentUser,
        setChecklists,
        addChecklist,
        updateChecklist,
        deleteChecklist,
        toggleDropdown,
        addDropdown,
        updateDropdown,
        deleteDropdown,
        toggleTaskCompletion,
        addTask,
        updateTask,
        deleteTask,
        openInfoModal,
        closeInfoModal,
        navigateBackToReferrer,
        refreshData,
        reorderDropdowns,
        reorderNestedDropdowns,
        reorderTasks,
        learningPages,
        selectedLearningPage,
        isLearningPageModalOpen,
        fetchLearningPages,
        fetchLearningPagesForTask,
        createLearningPage,
        updateLearningPage,
        deleteLearningPage,
        assignLearningPageToTask,
        removeLearningPageFromTask,
        openLearningPageModal,
        closeLearningPageModal,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
