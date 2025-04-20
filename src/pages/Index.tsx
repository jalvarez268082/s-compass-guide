
import React from 'react';
import { useStore } from '@/store/useStore';
import Header from '@/components/layout/Header';
import ChecklistView from '@/components/checklist/ChecklistView';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import EditModal from '@/components/admin/edit-modal';

const Index = () => {
  const { checklists, isAdminEditMode } = useStore();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">
              Loss and Bereavement Checklist
            </h2>
            
            {isAdminEditMode && (
              <Button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-1">
                <Plus size={18} /> New Checklist
              </Button>
            )}
          </div>
          
          <p className="text-gray-600 mb-8">
            A step-by-step guide to help you navigate the difficult process after losing a loved one.
          </p>
          
          <div className="space-y-6">
            {checklists.map((checklist) => (
              <ChecklistView key={checklist.id} checklist={checklist} />
            ))}
          </div>
          
          {checklists.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No checklists available yet.</p>
              {isAdminEditMode && (
                <Button onClick={() => setIsEditModalOpen(true)}>
                  Create Your First Checklist
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
      
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editType="checklist"
      />
      
      <footer className="bg-gray-100 py-4 border-t">
        <div className="container mx-auto text-center text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} Bereavement Compass Guide. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
