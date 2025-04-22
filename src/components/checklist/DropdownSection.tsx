import React from 'react';
import { Dropdown, Task } from '@/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import ChecklistItem from './ChecklistItem';
import { useStore } from '@/store/useStore';
import { useDragDrop } from './DragDropContext';

interface DropdownSectionProps {
  dropdown: Dropdown;
  checklistId: string;
  parentDropdownId?: string;
  onOpenInfoModal: (task: Task) => void;
  onEditItem: (itemId: string, itemType: 'dropdown' | 'task') => void;
  onAddItem: (type: 'dropdown' | 'task', parentId?: string) => void;
}

const DropdownSection: React.FC<DropdownSectionProps> = ({ 
  dropdown, 
  checklistId, 
  parentDropdownId,
  onOpenInfoModal,
  onEditItem,
  onAddItem
}) => {
  const { toggleDropdown, deleteDropdown, isAdminEditMode } = useStore();
  const { handleDragStart, handleDragEnd, handleDragOver, handleDrop } = useDragDrop();

  const handleToggle = () => {
    toggleDropdown(checklistId, dropdown.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditItem(dropdown.id, 'dropdown');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDropdown(checklistId, dropdown.id, parentDropdownId);
  };

  const handleAddTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddItem('task', dropdown.id);
  };

  const handleAddNestedDropdown = () => {
    onAddItem('dropdown', dropdown.id);
  };

  const draggableDropdown = {
    ...dropdown,
    checklist_id: checklistId,
    parent_dropdown_id: parentDropdownId || null
  };

  return (
    <Collapsible
      open={dropdown.expanded}
      onOpenChange={handleToggle}
      className="border rounded-md mb-3"
      draggable={isAdminEditMode}
      onDragStart={(e) => isAdminEditMode && handleDragStart(e, { type: 'dropdown', item: draggableDropdown })}
      onDragEnd={(e) => isAdminEditMode && handleDragEnd(e)}
      onDragOver={(e) => isAdminEditMode && handleDragOver(e)}
      onDrop={(e) => isAdminEditMode && handleDrop(e, { type: 'dropdown', item: draggableDropdown })}
    >
      <div className="flex items-center justify-between p-4 hover:bg-gray-50">
        <CollapsibleTrigger asChild>
          <div className="flex items-center flex-1 cursor-pointer">
            {isAdminEditMode && (
              <div className="cursor-grab hover:cursor-grabbing pr-2">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
            )}
            {dropdown.expanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
            )}
            <span className="text-sm font-medium">{dropdown.title}</span>
          </div>
        </CollapsibleTrigger>
        
        {/* Admin controls - separate from the trigger */}
        {isAdminEditMode && (
          <div className="flex items-center space-x-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleAddTask}
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <CollapsibleContent className="p-4 pt-2 space-y-2">
        {/* Nested dropdowns */}
        {dropdown.dropdowns && dropdown.dropdowns.length > 0 && (
          <div className="pl-4 border-l-2 border-gray-200">
            {dropdown.dropdowns.map((nestedDropdown) => (
              <DropdownSection
                key={nestedDropdown.id}
                dropdown={nestedDropdown}
                checklistId={checklistId}
                parentDropdownId={dropdown.id}
                onOpenInfoModal={onOpenInfoModal}
                onEditItem={onEditItem}
                onAddItem={onAddItem}
              />
            ))}
          </div>
        )}
        
        {/* Tasks */}
        {dropdown.tasks.map((task) => (
          <ChecklistItem
            key={task.id}
            task={task}
            checklistId={checklistId}
            dropdownId={dropdown.id}
            parentDropdownId={parentDropdownId}
            onOpenInfoModal={onOpenInfoModal}
            onEditItem={(id) => onEditItem(id, 'task')}
          />
        ))}
        
        {/* Admin controls for adding nested dropdown */}
        {isAdminEditMode && (
          <div className="mt-4 pt-2 border-t border-dashed">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleAddNestedDropdown}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Nested Section
            </Button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default DropdownSection;
