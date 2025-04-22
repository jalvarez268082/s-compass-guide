import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { processTaskLinks } from '@/lib/task-utils';

const TestTaskLinks: React.FC = () => {
  const { allTasks, openInfoModal } = useStore();

  const renderTaskLink = (taskId: string, taskTitle: string) => {
    return processTaskLinks(`[[task:${taskId}|${taskTitle}]]`);
  };

  const openSampleTask = () => {
    if (allTasks.length > 0) {
      openInfoModal(allTasks[0]);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Task Links Test Page</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Task Link Example</h2>
        <p className="mb-4">
          This page demonstrates how task links work. Below are examples of clickable task links:
        </p>
        
        <div className="border p-4 rounded-md bg-white">
          <h3 className="text-lg font-medium mb-2">Example Task Content</h3>
          
          {allTasks.length > 0 ? (
            <div className="prose">
              <p>
                To complete this task, first check out{' '}
                <span dangerouslySetInnerHTML={{ 
                  __html: renderTaskLink(
                    allTasks[0].id, 
                    allTasks[0].title
                  ) 
                }} />.
              </p>
              
              {allTasks.length > 1 && (
                <p className="mt-4">
                  For more advanced options, refer to{' '}
                  <span dangerouslySetInnerHTML={{ 
                    __html: renderTaskLink(
                      allTasks[1].id, 
                      allTasks[1].title
                    ) 
                  }} />.
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No tasks available. Please create some tasks first.</p>
          )}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-3">Manual Testing</h2>
        <Button 
          onClick={openSampleTask}
          disabled={allTasks.length === 0}
        >
          Open First Task
        </Button>
        <p className="mt-2 text-sm text-gray-500">
          This will open the first task directly, then you can test clicking task links within its content.
        </p>
      </div>
    </div>
  );
};

export default TestTaskLinks; 