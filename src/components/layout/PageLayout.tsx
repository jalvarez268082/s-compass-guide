import React from 'react';
import Header from './Header';

interface PageLayoutProps {
  title?: string;
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ title, children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={title} />
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  );
}; 