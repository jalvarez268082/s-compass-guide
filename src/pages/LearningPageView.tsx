import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, User, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { LearningPage } from '@/types';
import { processTaskLinks } from '@/lib/task-utils';
import * as api from '@/integrations/supabase/api';

const LearningPageView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, openLearningPageModal, deleteLearningPage } = useStore();
  
  const [learningPage, setLearningPage] = useState<LearningPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isAdmin = currentUser?.role === 'admin';
  
  useEffect(() => {
    const fetchLearningPage = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const page = await api.getLearningPageById(id);
        
        if (page) {
          setLearningPage(page);
        } else {
          setError('Learning page not found');
        }
      } catch (err) {
        console.error('Error fetching learning page:', err);
        setError('Failed to load the learning page');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLearningPage();
  }, [id]);
  
  const handleDelete = async () => {
    if (!learningPage || !isAdmin) return;
    
    if (confirm('Are you sure you want to delete this learning page?')) {
      const success = await deleteLearningPage(learningPage.id);
      
      if (success) {
        navigate('/learning');
      }
    }
  };
  
  const handleEdit = () => {
    if (!learningPage || !isAdmin) return;
    openLearningPageModal(learningPage);
  };
  
  // Process task links
  const processedContent = learningPage ? processTaskLinks(learningPage.content) : '';
  
  return (
    <PageLayout title="Learning Resource">
      <div className="container mx-auto py-8">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/learning" className="flex items-center">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Learning Resources
            </Link>
          </Button>
        </div>
        
        {loading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Unable to load the requested learning page.</p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" asChild>
                <Link to="/learning">Go to Learning Resources</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : learningPage ? (
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-2xl">{learningPage.title}</CardTitle>
              <CardDescription>
                <div className="flex flex-wrap gap-4 mt-2">
                  {learningPage.author && (
                    <div className="flex items-center text-sm">
                      <User className="mr-1 h-4 w-4 text-muted-foreground" />
                      {learningPage.author.email}
                      {learningPage.author.role === 'admin' && (
                        <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                    {format(new Date(learningPage.created_at), 'MMMM d, yyyy')}
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div 
                className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-primary/50 prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-sm"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />
            </CardContent>
            {isAdmin && (
              <CardFooter className="border-t flex justify-end space-x-2 pt-4 mt-6">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            )}
          </Card>
        ) : null}
      </div>
    </PageLayout>
  );
};

export default LearningPageView; 