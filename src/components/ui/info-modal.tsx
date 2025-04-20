
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
          <DialogTitle className="text-xl font-semibold">{task.title}</DialogTitle>
          <DialogDescription className="text-md font-medium text-primary mt-2">
            {task.content.subheader}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 text-left">
          <div className="whitespace-pre-wrap">{task.content.content}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InfoModal;
