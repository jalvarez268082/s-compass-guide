import React, { useMemo, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, BookOpen, X, ArrowLeft, BookOpenText } from "lucide-react";
import { Task, LearningPage } from '@/types';
import { useStore } from '@/store/useStore';
import { processTaskLinks } from '@/lib/task-utils';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

interface InfoModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ task, isOpen, onClose }) => {
  const { referrerTask, navigateBackToReferrer, fetchLearningPagesForTask, isAdmin } = useStore();
  const [learningPages, setLearningPages] = useState<LearningPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  
  // Process task links in content
  const processedContent = useMemo(() => {
    if (!task || !task.content) return '';
    return processTaskLinks(task.content.content || '');
  }, [task]);

  // Load learning pages for this task
  useEffect(() => {
    const loadLearningPages = async () => {
      if (!task) return;
      
      try {
        setLoadingPages(true);
        const pages = await fetchLearningPagesForTask(task.id);
        setLearningPages(pages);
      } catch (err) {
        console.error('Error loading learning pages:', err);
      } finally {
        setLoadingPages(false);
      }
    };
    
    if (isOpen && task) {
      loadLearningPages();
    }
  }, [isOpen, task, fetchLearningPagesForTask]);
  
  if (!task) return null;

  // Default content values if missing
  const contentSubheader = task.content?.subheader || task.title || 'Task Details';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-border bg-background/95 backdrop-blur-sm">
        <DialogHeader className="relative border-b border-border/30 pb-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Heart size={16} className="opacity-80" />
          </div>
          <div className="pl-12">
            <DialogTitle className="text-xl font-semibold text-foreground">
              {contentSubheader}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="mt-4 text-left space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          <div 
            className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-primary/50 prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-sm"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
          
          {/* Learning Resources section */}
          {learningPages.length > 0 && (
            <div className="mt-8">
              <Separator className="my-4" />
              <div className="flex items-center gap-2 mb-3">
                <BookOpenText className="text-primary h-5 w-5" />
                <h3 className="font-medium text-sm">Learning Resources</h3>
              </div>
              <ul className="space-y-2">
                {learningPages.map(page => (
                  <li key={page.id} className="rounded-md border p-3 hover:bg-muted/30 transition-colors">
                    <Link 
                      to={`/learning/${page.id}`} 
                      className="text-primary font-medium hover:underline block"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {page.title}
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {page.content.substring(0, 120)}...
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between border-t border-border/30 pt-4 mt-4">
          {referrerTask ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateBackToReferrer}
              className="mr-auto"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          ) : <div />}
          
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InfoModal;
