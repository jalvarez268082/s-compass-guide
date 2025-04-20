
import React, { useState } from 'react';
import { Checklist, Task } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from 'lucide-react';
import DropdownSection from './DropdownSection';
import InfoModal from '../ui/info-modal';
import EditModal from '../admin/edit-modal';
import { useStore } from '@/store/useStore';

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
    <>
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-2xl font-bold">{checklist.title}</CardTitle>
          
          {isAdminEditMode && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => handleAddItem('dropdown')}
              >
                <Plus className="h-4 w-4" />
                Add Section
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-amber-600"
                onClick={() => handleEditItem(checklist.id, 'checklist')}
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
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
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
    </>
  );
};

export default ChecklistView;
