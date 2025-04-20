import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Task } from '@/types';

interface InfoModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ task, isOpen, onClose }) => {
  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {task.content.subheader}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 text-left">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: task.content.content }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InfoModal;
