import React from 'react';
import { useStore } from '@/store/useStore';
import { ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AdminControls: React.FC = () => {
  const { toast } = useToast();

  return (
    <div className="mb-6 flex gap-2 items-center">
      <div className="mr-2 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm flex items-center">
        <ShieldAlert size={16} className="mr-1" /> 
        Admin Controls
      </div>
    </div>
  );
};

export default AdminControls; 