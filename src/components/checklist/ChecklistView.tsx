import React, { useState } from 'react';
import { Checklist, Task } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Heart, HelpCircle } from 'lucide-react';
import DropdownSection from './DropdownSection';
import InfoModal from '../ui/info-modal';
import EditModal from '../admin/edit-modal';
import { useStore } from '@/store/useStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { DragDropProvider } from './DragDropContext';

interface ChecklistViewProps {
  checklist: Checklist;
}

const ChecklistView: React.FC<ChecklistViewProps> = ({ checklist }) => {
  const { 
    isInfoModalOpen, 
    selectedTask, 
    openInfoModal, 
    closeInfoModal, 
    isAdminEditMode,
    deleteChecklist
  } = useStore();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<'checklist' | 'dropdown' | 'task'>('checklist');
  const [editItemId, setEditItemId] = useState<string | undefined>(undefined);
  const [editParentId, setEditParentId] = useState<string | undefined>(undefined);
  const [editGrandparentId, setEditGrandparentId] = useState<string | undefined>(undefined);

  // Calculate progress
  const calculateProgress = () => {
    let totalTasks = 0;
    let completedTasks = 0;
    
    checklist.dropdowns.forEach(dropdown => {
      dropdown.tasks.forEach(task => {
        totalTasks++;
        if (task.completed) completedTasks++;
      });
    });
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const progressPercentage = calculateProgress();

  const handleOpenInfoModal = (task: Task) => {
    openInfoModal(task);
  };

  const handleEditItem = (
    itemId: string, 
    itemType: 'checklist' | 'dropdown' | 'task', 
    parentId?: string,
    grandparentId?: string
  ) => {
    setEditType(itemType);
    setEditItemId(itemId);
    setEditParentId(parentId);
    setEditGrandparentId(grandparentId);
    setIsEditModalOpen(true);
  };

  const handleAddItem = (
    type: 'checklist' | 'dropdown' | 'task',
    parentId?: string,
    grandparentId?: string
  ) => {
    setEditType(type);
    setEditItemId(undefined);
    setEditParentId(parentId || checklist.id);
    setEditGrandparentId(grandparentId);
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    deleteChecklist(checklist.id);
  };

  return (
    <DragDropProvider>
      <Card className="shadow-md border-border bg-background/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
        <CardHeader className="pb-2 space-y-0">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                <CardTitle className="text-2xl font-bold text-foreground">{checklist.title}</CardTitle>
              </div>
              
              {isAdminEditMode && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-foreground"
                    onClick={() => handleAddItem('dropdown')}
                  >
                    <Plus className="h-4 w-4" />
                    Add Section
                  </Button>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                          onClick={() => handleEditItem(checklist.id, 'checklist')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit checklist</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={handleDelete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete checklist</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
            
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Your progress</span>
                <span className="text-sm font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            
            <p className="text-sm text-muted-foreground italic">
              We're here to help you through this difficult time. Take each task at your own pace.
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {checklist.dropdowns.map((dropdown) => (
              <DropdownSection
                key={dropdown.id}
                dropdown={dropdown}
                checklistId={checklist.id}
                onOpenInfoModal={handleOpenInfoModal}
                onEditItem={(id, type) => handleEditItem(id, type, checklist.id)}
                onAddItem={(type, parentId) => handleAddItem(type, parentId, checklist.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      <InfoModal
        task={selectedTask}
        isOpen={isInfoModalOpen}
        onClose={closeInfoModal}
      />
      
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editType={editType}
        itemId={editItemId}
        parentId={editParentId}
        grandparentId={editGrandparentId}
      />
    </DragDropProvider>
  );
};

export default ChecklistView;
