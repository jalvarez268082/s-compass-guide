
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectGroup, 
  SelectItem 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from '@/store/useStore';
import { Task, Dropdown, Checklist } from '@/types';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editType: 'checklist' | 'dropdown' | 'task';
  itemId?: string;
  parentId?: string;
  grandparentId?: string;
}

const EditModal: React.FC<EditModalProps> = ({ 
  isOpen, 
  onClose, 
  editType, 
  itemId, 
  parentId, 
  grandparentId 
}) => {
  const { 
    checklists, 
    addChecklist, 
    updateChecklist,
    addDropdown, 
    updateDropdown,
    addTask, 
    updateTask 
  } = useStore();
  
  const [selectedChecklist, setSelectedChecklist] = useState<string>('');
  const [selectedDropdown, setSelectedDropdown] = useState<string>('');
  const [selectedParentDropdown, setSelectedParentDropdown] = useState<string>('');
  const [title, setTitle] = useState('');
  const [subheader, setSubheader] = useState('');
  const [content, setContent] = useState('');
  const [dropdownType, setDropdownType] = useState<'top' | 'nested'>('top');

  useEffect(() => {
    if (isOpen) {
      // For new items
      if (!itemId) {
        // Default to first checklist if none selected
        if (checklists.length > 0 && !selectedChecklist) {
          setSelectedChecklist(checklists[0].id);
        }
        return;
      }
      
      // For editing existing items
      if (editType === 'checklist') {
        const checklist = checklists.find(c => c.id === itemId);
        if (checklist) {
          setTitle(checklist.title);
          setSelectedChecklist(checklist.id);
        }
      } 
      else if (editType === 'dropdown') {
        const checklist = checklists.find(c => c.id === parentId);
        if (checklist) {
          setSelectedChecklist(checklist.id);
          
          // Check if it's a top-level or nested dropdown
          if (grandparentId) {
            // Nested dropdown
            const parentDropdown = checklist.dropdowns.find(d => d.id === grandparentId);
            if (parentDropdown) {
              const dropdown = parentDropdown.dropdowns?.find(d => d.id === itemId);
              if (dropdown) {
                setDropdownType('nested');
                setSelectedParentDropdown(grandparentId);
                setTitle(dropdown.title);
              }
            }
          } else {
            // Top-level dropdown
            const dropdown = checklist.dropdowns.find(d => d.id === itemId);
            if (dropdown) {
              setDropdownType('top');
              setTitle(dropdown.title);
            }
          }
        }
      } 
      else if (editType === 'task') {
        const checklist = checklists.find(c => c.id === parentId);
        if (checklist) {
          setSelectedChecklist(checklist.id);
          
          // Check if task is in top-level dropdown or nested dropdown
          if (grandparentId) {
            // Task in nested dropdown
            const parentOfNested = checklist.dropdowns.find(d => d.id === grandparentId);
            if (parentOfNested) {
              setSelectedParentDropdown(grandparentId);
              const dropdown = parentOfNested.dropdowns?.find(d => d.id === selectedDropdown);
              if (dropdown) {
                setSelectedDropdown(dropdown.id);
                const task = dropdown.tasks.find(t => t.id === itemId);
                if (task) {
                  setTitle(task.title);
                  setSubheader(task.content.subheader);
                  setContent(task.content.content);
                }
              }
            }
          } else {
            // Task in top-level dropdown
            const dropdown = checklist.dropdowns.find(d => d.id === selectedDropdown);
            if (dropdown) {
              setSelectedDropdown(dropdown.id);
              const task = dropdown.tasks.find(t => t.id === itemId);
              if (task) {
                setTitle(task.title);
                setSubheader(task.content.subheader);
                setContent(task.content.content);
              }
            }
          }
        }
      }
    } else {
      // Reset form when closing
      resetForm();
    }
  }, [isOpen, itemId, editType, checklists, parentId, grandparentId]);

  const resetForm = () => {
    setTitle('');
    setSubheader('');
    setContent('');
    setDropdownType('top');
    setSelectedParentDropdown('');
  };

  const handleSave = () => {
    if (editType === 'checklist') {
      if (itemId) {
        // Update existing checklist
        const existingChecklist = checklists.find(c => c.id === itemId);
        if (existingChecklist) {
          updateChecklist({
            ...existingChecklist,
            title
          });
        }
      } else {
        // Create new checklist
        addChecklist({
          id: Date.now().toString(),
          title,
          dropdowns: []
        });
      }
    } 
    else if (editType === 'dropdown') {
      const newDropdown: Dropdown = {
        id: itemId || Date.now().toString(),
        title,
        tasks: itemId ? 
          (dropdownType === 'nested' && grandparentId) ? 
            checklists
              .find(c => c.id === selectedChecklist)
              ?.dropdowns
              .find(d => d.id === grandparentId)
              ?.dropdowns
              ?.find(d => d.id === itemId)?.tasks || [] 
            : 
            checklists
              .find(c => c.id === selectedChecklist)
              ?.dropdowns
              .find(d => d.id === itemId)?.tasks || [] 
          : [],
        expanded: false
      };
      
      if (itemId) {
        // Update existing dropdown
        if (dropdownType === 'nested' && selectedParentDropdown) {
          updateDropdown(selectedChecklist, newDropdown, selectedParentDropdown);
        } else {
          updateDropdown(selectedChecklist, newDropdown);
        }
      } else {
        // Create new dropdown
        if (dropdownType === 'nested' && selectedParentDropdown) {
          addDropdown(selectedChecklist, newDropdown, selectedParentDropdown);
        } else {
          addDropdown(selectedChecklist, newDropdown);
        }
      }
    } 
    else if (editType === 'task') {
      const newTask: Task = {
        id: itemId || Date.now().toString(),
        title,
        completed: false,
        content: {
          subheader,
          content
        }
      };
      
      if (itemId) {
        // Update existing task
        if (grandparentId) {
          updateTask(selectedChecklist, selectedDropdown, newTask, grandparentId);
        } else {
          updateTask(selectedChecklist, selectedDropdown, newTask);
        }
      } else {
        // Create new task
        if (selectedParentDropdown) {
          addTask(selectedChecklist, selectedDropdown, newTask, selectedParentDropdown);
        } else {
          addTask(selectedChecklist, selectedDropdown, newTask);
        }
      }
    }
    
    onClose();
  };

  // Get available dropdowns for the selected checklist
  const getAvailableDropdowns = () => {
    const selectedChecklistData = checklists.find(c => c.id === selectedChecklist);
    return selectedChecklistData?.dropdowns || [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {itemId ? `Edit ${editType}` : `Add new ${editType}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Checklist Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="checklist" className="text-right">
              Checklist
            </Label>
            <Select 
              value={selectedChecklist} 
              onValueChange={setSelectedChecklist}
              disabled={itemId && editType === 'checklist'}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select checklist" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {checklists.map((checklist) => (
                    <SelectItem key={checklist.id} value={checklist.id}>
                      {checklist.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          {/* Dropdown Type Selection (only for dropdown editing) */}
          {editType === 'dropdown' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dropdownType" className="text-right">
                Dropdown Type
              </Label>
              <Select value={dropdownType} onValueChange={(val: 'top' | 'nested') => setDropdownType(val)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="top">Top-level</SelectItem>
                    <SelectItem value="nested">Nested</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Parent Dropdown Selection (for nested dropdowns or tasks) */}
          {((editType === 'dropdown' && dropdownType === 'nested') || editType === 'task') && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parentDropdown" className="text-right">
                {editType === 'dropdown' ? 'Parent Dropdown' : 'Dropdown'}
              </Label>
              <Select 
                value={editType === 'dropdown' ? selectedParentDropdown : selectedDropdown} 
                onValueChange={editType === 'dropdown' ? setSelectedParentDropdown : setSelectedDropdown}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select dropdown" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {getAvailableDropdowns().map((dropdown) => (
                      <SelectItem key={dropdown.id} value={dropdown.id}>
                        {dropdown.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Nested Dropdown Selection (only for tasks in nested dropdowns) */}
          {editType === 'task' && selectedParentDropdown && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nestedDropdown" className="text-right">
                Nested Dropdown
              </Label>
              <Select value={selectedDropdown} onValueChange={setSelectedDropdown}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select nested dropdown" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {checklists
                      .find(c => c.id === selectedChecklist)
                      ?.dropdowns
                      .find(d => d.id === selectedParentDropdown)
                      ?.dropdowns
                      ?.map((dropdown) => (
                        <SelectItem key={dropdown.id} value={dropdown.id}>
                          {dropdown.title}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Title Input (common to all types) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              className="col-span-3"
              placeholder={`Enter ${editType} title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          {/* Task-specific fields */}
          {editType === 'task' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subheader" className="text-right">
                  Subheader
                </Label>
                <Input
                  id="subheader"
                  className="col-span-3"
                  placeholder="Enter task subheader"
                  value={subheader}
                  onChange={(e) => setSubheader(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="content" className="text-right align-top mt-2">
                  Content
                </Label>
                <Textarea
                  id="content"
                  className="col-span-3"
                  placeholder="Enter task content details"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                />
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSave}
            disabled={
              !title || 
              (editType === 'dropdown' && dropdownType === 'nested' && !selectedParentDropdown) ||
              (editType === 'task' && !selectedDropdown) ||
              (editType !== 'checklist' && !selectedChecklist)
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditModal;
