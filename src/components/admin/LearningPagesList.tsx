import React, { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit2, Trash2, BookOpen, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { LearningPageModal } from './LearningPageModal';

const LearningPagesList = () => {
  const { 
    learningPages, 
    fetchLearningPages, 
    deleteLearningPage, 
    isAdmin, 
    isLearningPageModalOpen,
    openLearningPageModal
  } = useStore();

  useEffect(() => {
    fetchLearningPages();
  }, [fetchLearningPages]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this learning page?')) {
      await deleteLearningPage(id);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Pages</CardTitle>
          <CardDescription>This area is for admin users only.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Learning Pages</CardTitle>
            <CardDescription>Create and manage learning resources for tasks</CardDescription>
          </div>
          <Button onClick={() => openLearningPageModal(null)} className="flex items-center gap-1">
            <PlusCircle className="h-4 w-4" />
            <span>Create</span>
          </Button>
        </CardHeader>
        <CardContent>
          {learningPages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No learning pages have been created yet.</p>
              <Button
                onClick={() => openLearningPageModal(null)}
                variant="outline"
                className="mt-4"
              >
                Create your first learning page
              </Button>
            </div>
          ) : (
            <Table>
              <TableCaption>List of all learning pages</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[180px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {learningPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">
                      <Link to={`/learning/${page.id}`} className="hover:text-primary flex items-center gap-1 group">
                        {page.title}
                        <ArrowUpRight className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </TableCell>
                    <TableCell>
                      {page.author ? (
                        <div className="flex items-center gap-1">
                          <span>{page.author.email}</span>
                          {page.author.role === 'admin' && (
                            <Badge variant="outline" className="text-xs">Admin</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(page.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openLearningPageModal(page)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(page.id)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {isLearningPageModalOpen && <LearningPageModal />}
    </>
  );
};

export default LearningPagesList; 