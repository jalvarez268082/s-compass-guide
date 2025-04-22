import React, { useState, useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import UnderlineExtension from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TaskLinkExtension from '@/extensions/TaskLinkExtension';
import { Toggle } from '@/components/ui/toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Type,
  Undo,
  Redo,
  Underline as UnderlineIcon,
  Quote,
  Code,
  Palette,
  FilePlus
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { Task } from '@/types';
import { processTaskLinks } from '@/lib/task-utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

// Define common colors for the color picker with purple focus
const COLORS = [
  { name: 'Default', value: 'inherit' },
  { name: 'Black', value: '#000000' },
  { name: 'Dark Gray', value: '#4b5563' },
  { name: 'Medium Gray', value: '#6b7280' },
  { name: 'Light Gray', value: '#9ca3af' },
  { name: 'Light Purple', value: '#c4b5fd' },
  { name: 'Medium Purple', value: '#8b5cf6' },
  { name: 'Rich Purple', value: '#7e22ce' },
  { name: 'Deep Purple', value: '#581c87' },
  { name: 'Royal Purple', value: '#4c1d95' },
  { name: 'Lavender', value: '#a78bfa' },
  { name: 'Violet', value: '#6d28d9' }
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [selectedColor, setSelectedColor] = useState<string>('inherit');
  const { allTasks } = useStore();

  // Process the content for preview
  const processedContent = useMemo(() => {
    return processTaskLinks(value);
  }, [value]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({
        openOnClick: false,
      }),
      UnderlineExtension,
      TextStyle,
      Color,
      TaskLinkExtension,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when value changes from outside
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  // Function to set text color
  const setColor = (color: string) => {
    editor?.chain().focus().setColor(color).run();
    setSelectedColor(color);
  };

  // Function to insert task link
  const insertTaskLink = (task: Task) => {
    const taskLink = `[[task:${task.id}|${task.title}]]`;
    editor?.chain().focus().insertContent(taskLink).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'write' | 'preview')}>
        <div className="flex justify-between items-center border-b bg-gray-50 px-3 py-2">
          <TabsList className="bg-transparent">
            <TabsTrigger value="write" className="text-xs">Write</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
          </TabsList>
          
          {mode === 'write' && (
            <div className="flex flex-wrap gap-0.5">
              <div className="flex gap-0.5 mr-1">
                <Toggle 
                  size="sm" 
                  pressed={editor.isActive('bold')} 
                  onPressedChange={() => editor.chain().focus().toggleBold().run()}
                  className="p-1 h-8 w-8"
                  aria-label="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Toggle>
                
                <Toggle 
                  size="sm" 
                  pressed={editor.isActive('italic')} 
                  onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                  className="p-1 h-8 w-8"
                  aria-label="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Toggle>

                <Toggle 
                  size="sm" 
                  pressed={editor.isActive('underline')} 
                  onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                  className="p-1 h-8 w-8"
                  aria-label="Underline"
                >
                  <UnderlineIcon className="h-4 w-4" />
                </Toggle>

                {/* Color picker dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-1 h-8 w-8"
                      aria-label="Text Color"
                    >
                      <Palette className="h-4 w-4" style={{ color: selectedColor !== 'inherit' ? selectedColor : undefined }} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {COLORS.map((color) => (
                      <DropdownMenuItem 
                        key={color.value}
                        onClick={() => setColor(color.value)}
                        className="flex items-center gap-2"
                      >
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300" 
                          style={{ backgroundColor: color.value === 'inherit' ? 'transparent' : color.value }}
                        />
                        <span style={{ color: color.value === 'inherit' ? 'inherit' : color.value }}>
                          {color.name}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex gap-0.5 mr-1">
                <Toggle 
                  size="sm" 
                  pressed={editor.isActive('bulletList')} 
                  onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                  className="p-1 h-8 w-8"
                  aria-label="Bullet List"
                >
                  <List className="h-4 w-4" />
                </Toggle>
                
                <Toggle 
                  size="sm" 
                  pressed={editor.isActive('orderedList')} 
                  onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                  className="p-1 h-8 w-8"
                  aria-label="Ordered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </Toggle>

                <Toggle 
                  size="sm" 
                  pressed={editor.isActive('blockquote')} 
                  onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                  className="p-1 h-8 w-8"
                  aria-label="Quote"
                >
                  <Quote className="h-4 w-4" />
                </Toggle>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1 h-8 flex items-center gap-1 text-xs"
                  >
                    <Type className="h-4 w-4" />
                    <span>Heading</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
                  >
                    <Heading1 className="h-4 w-4 mr-2" />
                    <span>Heading 1</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
                  >
                    <Heading2 className="h-4 w-4 mr-2" />
                    <span>Heading 2</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
                  >
                    <Heading3 className="h-4 w-4 mr-2" />
                    <span>Heading 3</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Toggle 
                size="sm" 
                pressed={editor.isActive('link')} 
                onPressedChange={() => {
                  const url = window.prompt('URL')
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run()
                  } else if (editor.isActive('link')) {
                    editor.chain().focus().unsetLink().run()
                  }
                }}
                className="p-1 h-8 w-8"
                aria-label="Link"
              >
                <LinkIcon className="h-4 w-4" />
              </Toggle>

              {/* Task Link Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1 h-8 w-8"
                    aria-label="Task Link"
                  >
                    <FilePlus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-56 overflow-y-auto">
                  {allTasks.map((task) => (
                    <DropdownMenuItem 
                      key={task.id}
                      onClick={() => insertTaskLink(task)}
                      className="flex items-center gap-2"
                    >
                      <span>{task.title}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex gap-0.5 ml-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className="p-1 h-8 w-8" 
                  aria-label="Undo"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className="p-1 h-8 w-8" 
                  aria-label="Redo"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <TabsContent value="write" className="mt-0">
          <EditorContent 
            editor={editor} 
            className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto prose prose-sm focus:outline-none"
          />
        </TabsContent>
        
        <TabsContent value="preview" className="mt-0">
          <div 
            className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto prose prose-sm"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RichTextEditor; 