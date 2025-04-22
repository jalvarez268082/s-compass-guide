import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LearningPage } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { processTaskLinks } from '@/lib/task-utils';

export const LearningPageModal: React.FC = () => {
  const { selectedLearningPage, isLearningPageModalOpen, closeLearningPageModal, createLearningPage, updateLearningPage } = useStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (selectedLearningPage) {
      setTitle(selectedLearningPage.title);
      setContent(selectedLearningPage.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [selectedLearningPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content) {
      alert('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (selectedLearningPage) {
        // Update existing learning page
        await updateLearningPage({
          ...selectedLearningPage,
          title,
          content
        });
      } else {
        // Create new learning page
        await createLearningPage({
          title,
          content,
          created_by: '' // This will be populated by the API
        });
      }
      
      closeLearningPageModal();
    } catch (err) {
      console.error('Error saving learning page:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Process task links for preview
  const processedContent = processTaskLinks(content);

  return (
    <Dialog open={isLearningPageModalOpen} onOpenChange={closeLearningPageModal}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {selectedLearningPage ? 'Edit Learning Page' : 'Create Learning Page'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for the learning page"
                required
              />
            </div>
            
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-2">
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter the learning page content. You can use markdown and task links with [[task:id|label]] syntax."
                    className="min-h-[300px]"
                    required
                  />
                </div>
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div className="border rounded-md p-4 min-h-[300px] prose prose-sm max-w-none dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: processedContent }} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeLearningPageModal}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : selectedLearningPage ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 