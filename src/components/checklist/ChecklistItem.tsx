import React from 'react';
import { Task } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Info, Edit, Trash2, GripVertical } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useDragDrop } from './DragDropContext';

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
  const { handleDragStart, handleDragEnd, handleDragOver, handleDrop } = useDragDrop();

  const handleTaskToggle = () => {
    toggleTaskCompletion(checklistId, dropdownId, task.id);
  };

  const handleDelete = () => {
    deleteTask(checklistId, dropdownId, task.id, parentDropdownId);
  };

  const handleEdit = () => {
    onEditItem(task.id, 'task');
  };

  const draggableTask = {
    ...task,
    dropdown_id: dropdownId 
  };

  return (
    <div 
      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
      draggable={isAdminEditMode}
      onDragStart={(e) => isAdminEditMode && handleDragStart(e, { type: 'task', item: draggableTask })}
      onDragEnd={(e) => isAdminEditMode && handleDragEnd(e)}
      onDragOver={(e) => isAdminEditMode && handleDragOver(e)}
      onDrop={(e) => isAdminEditMode && handleDrop(e, { type: 'task', item: draggableTask })}
    >
      <div className="flex items-center gap-3 flex-1">
        {isAdminEditMode && (
          <div className="cursor-grab hover:cursor-grabbing p-1">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        )}
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
      
      <div className="flex items-center">
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
