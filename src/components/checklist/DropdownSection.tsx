
import React from 'react';
import { Dropdown, Task } from '@/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus, Edit, Trash2 } from 'lucide-react';
import ChecklistItem from './ChecklistItem';
import { useStore } from '@/store/useStore';

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

  const handleToggle = () => {
    toggleDropdown(checklistId, dropdown.id);
  };

  const handleEdit = () => {
    onEditItem(dropdown.id, 'dropdown');
  };

  const handleDelete = () => {
    deleteDropdown(checklistId, dropdown.id, parentDropdownId);
  };

  const handleAddTask = () => {
    onAddItem('task', dropdown.id);
  };

  const handleAddNestedDropdown = () => {
    onAddItem('dropdown', dropdown.id);
  };

  return (
    <Collapsible
      open={dropdown.expanded}
      onOpenChange={handleToggle}
      className="border rounded-md mb-3"
    >
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="p-0 hover:bg-transparent">
            <div className="flex items-center space-x-2">
              {dropdown.expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <h3 className="text-base font-medium">{dropdown.title}</h3>
            </div>
          </Button>
        </CollapsibleTrigger>
        
        {isAdminEditMode && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-green-600"
              onClick={handleAddTask}
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-amber-600"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-red-600"
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
