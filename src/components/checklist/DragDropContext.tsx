import React, { createContext, useContext, useState } from 'react';
import { Dropdown, Task } from '@/types';
import { useStore } from '@/store/useStore';

// Extend types with database fields needed for drag-drop functionality
interface ExtendedDropdown extends Dropdown {
  checklist_id?: string;
  parent_dropdown_id?: string | null;
}

interface ExtendedTask extends Task {
  dropdown_id?: string;
}

// Define a type that can handle both dropdowns and tasks
export type DraggableItem = 
  | { type: 'dropdown'; item: ExtendedDropdown; } 
  | { type: 'task'; item: ExtendedTask; };

// Interface for the drag drop context
interface DragDropContextType {
  draggedItem: DraggableItem | null;
  setDraggedItem: (item: DraggableItem | null) => void;
  handleDragStart: (e: React.DragEvent, item: DraggableItem) => void;
  handleDragEnd: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetItem: DraggableItem) => void;
}

const DragDropContext = createContext<DragDropContextType | null>(null);

export function DragDropProvider({ children }: { children: React.ReactNode }) {
  const [draggedItem, setDraggedItem] = useState<DraggableItem | null>(null);
  const store = useStore();

  const handleDragStart = (e: React.DragEvent, item: DraggableItem) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem(item);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetItem: DraggableItem) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    // Don't do anything if dropping onto the same item
    if (draggedItem.item.id === targetItem.item.id && draggedItem.type === targetItem.type) {
      return;
    }

    // Handle reordering based on item types
    if (draggedItem.type === 'dropdown' && targetItem.type === 'dropdown') {
      // Handle dropdown reordering
      const draggedDropdown = draggedItem.item;
      const targetDropdown = targetItem.item;
      
      // Check if they're in the same parent (either top-level or same nested parent)
      const isSameParent = 
        draggedDropdown.parent_dropdown_id === targetDropdown.parent_dropdown_id && 
        draggedDropdown.checklist_id === targetDropdown.checklist_id;
      
      if (isSameParent) {
        // Determine all sibling dropdowns
        let siblingDropdowns: ExtendedDropdown[] = [];
        
        if (draggedDropdown.parent_dropdown_id) {
          // Get parent dropdown's nested dropdowns
          const parentDropdown = store.checklists
            .flatMap(c => c.dropdowns)
            .find(d => d.id === draggedDropdown.parent_dropdown_id);
            
          if (parentDropdown && parentDropdown.dropdowns) {
            siblingDropdowns = [...parentDropdown.dropdowns] as ExtendedDropdown[];
          }
        } else {
          // Get all top-level dropdowns in the checklist
          const checklist = store.checklists.find(c => c.id === draggedDropdown.checklist_id);
          if (checklist) {
            siblingDropdowns = [...checklist.dropdowns] as ExtendedDropdown[];
          }
        }
        
        // Filter out the dragged item, add it at the new position
        siblingDropdowns = siblingDropdowns.filter(d => d.id !== draggedDropdown.id);
        const targetIndex = siblingDropdowns.findIndex(d => d.id === targetDropdown.id);
        siblingDropdowns.splice(targetIndex + 1, 0, draggedDropdown);
        
        // Assign new positions (0-based index)
        const reorderedDropdowns = siblingDropdowns.map((dropdown, index) => ({
          ...dropdown,
          position: index
        }));
        
        // Call the reorder function in the store
        if (draggedDropdown.parent_dropdown_id) {
          // Reorder nested dropdowns
          await store.reorderNestedDropdowns(draggedDropdown.parent_dropdown_id, reorderedDropdowns);
        } else if (draggedDropdown.checklist_id) {
          // Reorder top-level dropdowns
          await store.reorderDropdowns(draggedDropdown.checklist_id, reorderedDropdowns);
        }
      }
    } else if (draggedItem.type === 'task' && targetItem.type === 'task') {
      // Handle task reordering
      const draggedTask = draggedItem.item;
      const targetTask = targetItem.item;
      
      // Check if both tasks are in the same dropdown
      if (draggedTask.dropdown_id === targetTask.dropdown_id && draggedTask.dropdown_id) {
        // Find the parent dropdown to get all sibling tasks
        const dropdown = store.checklists
          .flatMap(c => c.dropdowns)
          .find(d => d.id === draggedTask.dropdown_id);
          
        if (dropdown) {
          // Create a new array of tasks with updated positions
          let tasks = [...dropdown.tasks] as ExtendedTask[];
          // Remove the dragged task
          tasks = tasks.filter(t => t.id !== draggedTask.id);
          // Find the index of the target task
          const targetIndex = tasks.findIndex(t => t.id === targetTask.id);
          // Insert the dragged task after the target task
          tasks.splice(targetIndex + 1, 0, draggedTask);
          
          // Assign new positions
          const reorderedTasks = tasks.map((task, index) => ({
            ...task,
            position: index
          }));
          
          // Call the reorder function in the store
          await store.reorderTasks(draggedTask.dropdown_id, reorderedTasks);
        }
      }
    }
    // Could also handle moving tasks between dropdowns or other combinations as needed
    
    setDraggedItem(null);
  };

  const contextValue: DragDropContextType = {
    draggedItem,
    setDraggedItem,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      {children}
    </DragDropContext.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
} 