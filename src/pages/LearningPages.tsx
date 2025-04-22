import React from 'react';
import { useStore } from '@/store/useStore';
import { PageLayout } from '@/components/layout/PageLayout';
import LearningPagesList from '@/components/admin/LearningPagesList';

const LearningPages: React.FC = () => {
  const { currentUser } = useStore();
  const isAdmin = currentUser?.role === 'admin';

  return (
    <PageLayout title="Learning Resources">
      <div className="container mx-auto py-8">
        <LearningPagesList />
      </div>
    </PageLayout>
  );
};

export default LearningPages; 