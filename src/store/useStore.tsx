
import React, { createContext, useContext, useState } from 'react';
import { Task, Dropdown, Checklist, User } from '../types';

interface StoreContextType {
  currentUser: User | null;
  checklists: Checklist[];
  selectedTask: Task | null;
  isInfoModalOpen: boolean;
  isAdminEditMode: boolean;
  
  setCurrentUser: (user: User | null) => void;
  setChecklists: (checklists: Checklist[]) => void;
  addChecklist: (checklist: Checklist) => void;
  updateChecklist: (checklist: Checklist) => void;
  deleteChecklist: (checklistId: string) => void;
  toggleDropdown: (checklistId: string, dropdownId: string) => void;
  addDropdown: (checklistId: string, dropdown: Dropdown, parentDropdownId?: string) => void;
  updateDropdown: (checklistId: string, dropdown: Dropdown, parentDropdownId?: string) => void;
  deleteDropdown: (checklistId: string, dropdownId: string, parentDropdownId?: string) => void;
  toggleTaskCompletion: (checklistId: string, dropdownId: string, taskId: string) => void;
  addTask: (checklistId: string, dropdownId: string, task: Task, parentDropdownId?: string) => void;
  updateTask: (checklistId: string, dropdownId: string, task: Task, parentDropdownId?: string) => void;
  deleteTask: (checklistId: string, dropdownId: string, taskId: string, parentDropdownId?: string) => void;
  openInfoModal: (task: Task) => void;
  closeInfoModal: () => void;
  toggleAdminEditMode: () => void;
}

// Create mock data for initial state
const mockData: Checklist[] = [
  {
    id: '1',
    title: 'Bereavement Checklist',
    dropdowns: [
      {
        id: '1-1',
        title: 'Immediate Steps',
        expanded: false,
        tasks: [
          {
            id: '1-1-1',
            title: 'Notify close family and friends',
            completed: false,
            content: {
              subheader: 'How to notify loved ones',
              content: 'Consider making a list of people to contact. Ask a friend or family member to help make calls. For distant friends or colleagues, an email might be appropriate.'
            }
          },
          {
            id: '1-1-2',
            title: 'Contact funeral home',
            completed: false,
            content: {
              subheader: 'Selecting a funeral home',
              content: 'Research funeral homes in your area. Ask about their services and pricing. Consider if your loved one had any pre-arrangements.'
            }
          }
        ]
      },
      {
        id: '1-2',
        title: 'Documentation',
        expanded: false,
        tasks: [
          {
            id: '1-2-1',
            title: 'Obtain death certificates',
            completed: false,
            content: {
              subheader: 'Death certificates',
              content: 'Order multiple certified copies (typically 10-15). You\'ll need these for banks, insurance companies, and government agencies.'
            }
          },
          {
            id: '1-2-2',
            title: 'Locate important documents',
            completed: false,
            content: {
              subheader: 'Important documents to locate',
              content: 'Look for: will, trust documents, insurance policies, bank statements, property deeds, vehicle titles, and tax returns.'
            }
          }
        ],
        dropdowns: [
          {
            id: '1-2-3',
            title: 'Legal Documents',
            expanded: false,
            tasks: [
              {
                id: '1-2-3-1',
                title: 'Find the will',
                completed: false,
                content: {
                  subheader: 'Locating the will',
                  content: 'Check safe deposit boxes, home offices, and with the deceased\'s attorney. If no will exists, consult with a probate attorney about next steps.'
                }
              }
            ]
          }
        ]
      }
    ]
  }
];

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [currentUser, setCurrentUser] = useState<User | null>({ 
    id: '1', 
    email: 'admin@example.com', 
    role: 'admin' 
  });
  const [checklists, setChecklists] = useState<Checklist[]>(mockData);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isAdminEditMode, setIsAdminEditMode] = useState<boolean>(false);

  // Helper function to find and update nested dropdowns
  const updateNestedDropdown = (dropdowns: Dropdown[], targetId: string, updater: (dropdown: Dropdown) => Dropdown): Dropdown[] => {
    return dropdowns.map(dropdown => {
      if (dropdown.id === targetId) {
        return updater(dropdown);
      }
      if (dropdown.dropdowns) {
        return {
          ...dropdown,
          dropdowns: updateNestedDropdown(dropdown.dropdowns, targetId, updater)
        };
      }
      return dropdown;
    });
  };

  // Actions
  const addChecklist = (checklist: Checklist) => {
    setChecklists(prev => [...prev, checklist]);
  };

  const updateChecklist = (checklist: Checklist) => {
    setChecklists(prev => prev.map(c => c.id === checklist.id ? checklist : c));
  };

  const deleteChecklist = (checklistId: string) => {
    setChecklists(prev => prev.filter(c => c.id !== checklistId));
  };

  const toggleDropdown = (checklistId: string, dropdownId: string) => {
    setChecklists(prev => 
      prev.map(checklist => {
        if (checklist.id === checklistId) {
          const updatedDropdowns = checklist.dropdowns.map(dropdown => {
            if (dropdown.id === dropdownId) {
              return { ...dropdown, expanded: !dropdown.expanded };
            }
            if (dropdown.dropdowns) {
              return {
                ...dropdown,
                dropdowns: updateNestedDropdown(dropdown.dropdowns, dropdownId, d => ({
                  ...d,
                  expanded: !d.expanded
                }))
              };
            }
            return dropdown;
          });
          
          return { ...checklist, dropdowns: updatedDropdowns };
        }
        return checklist;
      })
    );
  };

  const addDropdown = (checklistId: string, dropdown: Dropdown, parentDropdownId?: string) => {
    setChecklists(prev => 
      prev.map(checklist => {
        if (checklist.id === checklistId) {
          if (!parentDropdownId) {
            return { ...checklist, dropdowns: [...checklist.dropdowns, dropdown] };
          } else {
            const updatedDropdowns = checklist.dropdowns.map(d => {
              if (d.id === parentDropdownId) {
                return { 
                  ...d, 
                  dropdowns: d.dropdowns ? [...d.dropdowns, dropdown] : [dropdown] 
                };
              }
              if (d.dropdowns) {
                return {
                  ...d,
                  dropdowns: updateNestedDropdown(d.dropdowns, parentDropdownId, parent => ({
                    ...parent,
                    dropdowns: parent.dropdowns ? [...parent.dropdowns, dropdown] : [dropdown]
                  }))
                };
              }
              return d;
            });
            
            return { ...checklist, dropdowns: updatedDropdowns };
          }
        }
        return checklist;
      })
    );
  };

  const updateDropdown = (checklistId: string, dropdown: Dropdown, parentDropdownId?: string) => {
    setChecklists(prev => 
      prev.map(checklist => {
        if (checklist.id === checklistId) {
          if (!parentDropdownId) {
            return { 
              ...checklist, 
              dropdowns: checklist.dropdowns.map(d => d.id === dropdown.id ? dropdown : d) 
            };
          } else {
            const updatedDropdowns = checklist.dropdowns.map(d => {
              if (d.id === parentDropdownId) {
                return { 
                  ...d, 
                  dropdowns: d.dropdowns?.map(nd => nd.id === dropdown.id ? dropdown : nd) 
                };
              }
              if (d.dropdowns) {
                return {
                  ...d,
                  dropdowns: updateNestedDropdown(d.dropdowns, parentDropdownId, parent => ({
                    ...parent,
                    dropdowns: parent.dropdowns?.map(nd => nd.id === dropdown.id ? dropdown : nd)
                  }))
                };
              }
              return d;
            });
            
            return { ...checklist, dropdowns: updatedDropdowns };
          }
        }
        return checklist;
      })
    );
  };

  const deleteDropdown = (checklistId: string, dropdownId: string, parentDropdownId?: string) => {
    setChecklists(prev => 
      prev.map(checklist => {
        if (checklist.id === checklistId) {
          if (!parentDropdownId) {
            return { 
              ...checklist, 
              dropdowns: checklist.dropdowns.filter(d => d.id !== dropdownId) 
            };
          } else {
            const updatedDropdowns = checklist.dropdowns.map(d => {
              if (d.id === parentDropdownId) {
                return { 
                  ...d, 
                  dropdowns: d.dropdowns?.filter(nd => nd.id !== dropdownId) 
                };
              }
              if (d.dropdowns) {
                return {
                  ...d,
                  dropdowns: updateNestedDropdown(d.dropdowns, parentDropdownId, parent => ({
                    ...parent,
                    dropdowns: parent.dropdowns?.filter(nd => nd.id !== dropdownId)
                  }))
                };
              }
              return d;
            });
            
            return { ...checklist, dropdowns: updatedDropdowns };
          }
        }
        return checklist;
      })
    );
  };

  const toggleTaskCompletion = (checklistId: string, dropdownId: string, taskId: string) => {
    setChecklists(prev => 
      prev.map(checklist => {
        if (checklist.id === checklistId) {
          // Check top-level dropdowns first
          const dropdownWithTask = checklist.dropdowns.find(d => d.id === dropdownId);
          if (dropdownWithTask) {
            return {
              ...checklist,
              dropdowns: checklist.dropdowns.map(dropdown => {
                if (dropdown.id === dropdownId) {
                  return {
                    ...dropdown,
                    tasks: dropdown.tasks.map(task => {
                      if (task.id === taskId) {
                        return { ...task, completed: !task.completed };
                      }
                      return task;
                    })
                  };
                }
                return dropdown;
              })
            };
          }
          
          // Check nested dropdowns
          return {
            ...checklist,
            dropdowns: checklist.dropdowns.map(dropdown => {
              if (dropdown.dropdowns) {
                return {
                  ...dropdown,
                  dropdowns: updateNestedDropdown(dropdown.dropdowns, dropdownId, d => ({
                    ...d,
                    tasks: d.tasks.map(task => {
                      if (task.id === taskId) {
                        return { ...task, completed: !task.completed };
                      }
                      return task;
                    })
                  }))
                };
              }
              return dropdown;
            })
          };
        }
        return checklist;
      })
    );
  };

  const addTask = (checklistId: string, dropdownId: string, task: Task, parentDropdownId?: string) => {
    setChecklists(prev => 
      prev.map(checklist => {
        if (checklist.id === checklistId) {
          if (!parentDropdownId) {
            return {
              ...checklist,
              dropdowns: checklist.dropdowns.map(dropdown => {
                if (dropdown.id === dropdownId) {
                  return { ...dropdown, tasks: [...dropdown.tasks, task] };
                }
                return dropdown;
              })
            };
          } else {
            return {
              ...checklist,
              dropdowns: checklist.dropdowns.map(dropdown => {
                if (dropdown.id === parentDropdownId && dropdown.dropdowns) {
                  return {
                    ...dropdown,
                    dropdowns: dropdown.dropdowns.map(nestedDropdown => {
                      if (nestedDropdown.id === dropdownId) {
                        return {
                          ...nestedDropdown,
                          tasks: [...nestedDropdown.tasks, task]
                        };
                      }
                      return nestedDropdown;
                    })
                  };
                }
                return dropdown;
              })
            };
          }
        }
        return checklist;
      })
    );
  };

  const updateTask = (checklistId: string, dropdownId: string, task: Task, parentDropdownId?: string) => {
    setChecklists(prev => 
      prev.map(checklist => {
        if (checklist.id === checklistId) {
          if (!parentDropdownId) {
            return {
              ...checklist,
              dropdowns: checklist.dropdowns.map(dropdown => {
                if (dropdown.id === dropdownId) {
                  return {
                    ...dropdown,
                    tasks: dropdown.tasks.map(t => t.id === task.id ? task : t)
                  };
                }
                return dropdown;
              })
            };
          } else {
            return {
              ...checklist,
              dropdowns: checklist.dropdowns.map(dropdown => {
                if (dropdown.id === parentDropdownId && dropdown.dropdowns) {
                  return {
                    ...dropdown,
                    dropdowns: dropdown.dropdowns.map(nestedDropdown => {
                      if (nestedDropdown.id === dropdownId) {
                        return {
                          ...nestedDropdown,
                          tasks: nestedDropdown.tasks.map(t => t.id === task.id ? task : t)
                        };
                      }
                      return nestedDropdown;
                    })
                  };
                }
                return dropdown;
              })
            };
          }
        }
        return checklist;
      })
    );
  };

  const deleteTask = (checklistId: string, dropdownId: string, taskId: string, parentDropdownId?: string) => {
    setChecklists(prev => 
      prev.map(checklist => {
        if (checklist.id === checklistId) {
          if (!parentDropdownId) {
            return {
              ...checklist,
              dropdowns: checklist.dropdowns.map(dropdown => {
                if (dropdown.id === dropdownId) {
                  return {
                    ...dropdown,
                    tasks: dropdown.tasks.filter(t => t.id !== taskId)
                  };
                }
                return dropdown;
              })
            };
          } else {
            return {
              ...checklist,
              dropdowns: checklist.dropdowns.map(dropdown => {
                if (dropdown.id === parentDropdownId && dropdown.dropdowns) {
                  return {
                    ...dropdown,
                    dropdowns: dropdown.dropdowns.map(nestedDropdown => {
                      if (nestedDropdown.id === dropdownId) {
                        return {
                          ...nestedDropdown,
                          tasks: nestedDropdown.tasks.filter(t => t.id !== taskId)
                        };
                      }
                      return nestedDropdown;
                    })
                  };
                }
                return dropdown;
              })
            };
          }
        }
        return checklist;
      })
    );
  };

  const openInfoModal = (task: Task) => {
    setSelectedTask(task);
    setIsInfoModalOpen(true);
  };

  const closeInfoModal = () => {
    setIsInfoModalOpen(false);
    setSelectedTask(null);
  };

  const toggleAdminEditMode = () => {
    setIsAdminEditMode(prev => !prev);
  };

  const contextValue = {
    currentUser,
    checklists,
    selectedTask,
    isInfoModalOpen,
    isAdminEditMode,
    
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
    toggleAdminEditMode
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
