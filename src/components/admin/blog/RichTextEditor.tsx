import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Link as LinkIcon,
  ImageIcon,
  Undo,
  Redo,
} from 'lucide-react';
import { useCallback } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: 'Comece a escrever o conteúdo do artigo...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL do link:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('URL da imagem:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-0.5 p-1.5 border-b bg-muted/30">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleBold().run()} data-active={editor.isActive('bold')}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleItalic().run()} data-active={editor.isActive('italic')}>
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-8 bg-border mx-0.5" />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} data-active={editor.isActive('heading', { level: 2 })}>
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} data-active={editor.isActive('heading', { level: 3 })}>
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className="w-px h-8 bg-border mx-0.5" />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleBulletList().run()} data-active={editor.isActive('bulletList')}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleOrderedList().run()} data-active={editor.isActive('orderedList')}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleBlockquote().run()} data-active={editor.isActive('blockquote')}>
          <Quote className="h-4 w-4" />
        </Button>
        <div className="w-px h-8 bg-border mx-0.5" />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={setLink} data-active={editor.isActive('link')}>
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </Button>
        <div className="w-px h-8 bg-border mx-0.5" />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 min-h-[300px] focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0" />
    </div>
  );
};

export default RichTextEditor;
