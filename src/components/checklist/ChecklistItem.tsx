
import React from 'react';
import { Task } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Info, Edit, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface ChecklistItemProps {
  task: Task;
  checklistId: string;
  dropdownId: string;
  parentDropdownId?: string;
  onOpenInfoModal: (task: Task) => void;
  onEditItem: (itemId: string, itemType: 'task') => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  task,
  checklistId,
  dropdownId,
  parentDropdownId,
  onOpenInfoModal,
  onEditItem,
}) => {
  const { toggleTaskCompletion, deleteTask, isAdminEditMode } = useStore();

  const handleTaskToggle = () => {
    toggleTaskCompletion(checklistId, dropdownId, task.id);
  };

  const handleDelete = () => {
    deleteTask(checklistId, dropdownId, task.id, parentDropdownId);
  };

  const handleEdit = () => {
    onEditItem(task.id, 'task');
  };

  return (
    <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
      <div className="flex items-center gap-3 flex-1">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.completed}
          onCheckedChange={handleTaskToggle}
        />
        <label
          htmlFor={`task-${task.id}`}
          className={`text-sm cursor-pointer flex-1 ${
            task.completed ? 'line-through text-gray-400' : ''
          }`}
        >
          {task.title}
        </label>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-blue-600"
          onClick={() => onOpenInfoModal(task)}
        >
          <Info className="h-4 w-4" />
        </Button>
        
        {isAdminEditMode && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default ChecklistItem;
