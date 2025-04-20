import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Dropdown, Checklist, User } from '../types';
import * as api from '@/integrations/supabase/api';
import * as auth from '@/integrations/supabase/auth';

interface StoreContextType {
  currentUser: User | null;
  checklists: Checklist[];
  selectedTask: Task | null;
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
  openInfoModal: (task: Task) => void;
  closeInfoModal: () => void;
  refreshData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isAdminEditMode, setIsAdminEditMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

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
      // Get current user from auth
      const { user, error: userError } = await auth.getCurrentUser();
      
      if (userError) {
        console.error('Error getting current user:', userError);
      }
      
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        // If user is admin, automatically enable admin mode
        if (user.role === 'admin') {
          setIsAdminEditMode(true);
        }
        
        // Get checklists
        const checklistsData = await api.getChecklists();
        setChecklists(checklistsData);
      } else {
        // Not authenticated, clear data
        setChecklists([]);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
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

  const openInfoModal = (task: Task) => {
    setSelectedTask(task);
    setIsInfoModalOpen(true);
  };

  const closeInfoModal = () => {
    setIsInfoModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <StoreContext.Provider
      value={{
    currentUser,
    checklists,
    selectedTask,
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
        refreshData
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
