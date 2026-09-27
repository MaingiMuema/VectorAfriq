
"use client";

import { imageCache } from "@/utils/imageCache";
import {
  useEditor,
  EditorContent,
  Editor as TiptapEditor,
  NodeViewRendererProps,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { toast } from "react-hot-toast";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  Code,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette,
  Minus,
  Undo2,
  Redo2,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  CheckSquare,
  Table as TableIcon,
  TableProperties,
  RowsIcon,
  ColumnsIcon,
  Trash2,
  Plus,
  RemoveFormatting,
  Type,
  ChevronDown,
} from "lucide-react";

// Custom extension for resizable images
const ResizableImage = Image.extend({
  addNodeView() {
    return (props: NodeViewRendererProps) => {
      const { node, editor } = props;
      const container = document.createElement("div");
      const wrapper = document.createElement("div");

      container.classList.add("image-container");
      wrapper.classList.add("image-wrapper");

      const img = document.createElement("img");
      img.src = node.attrs.src;
      img.className = "editor-image";
      if (node.attrs.width) {
        img.style.width = `${node.attrs.width}px`;
      }

      const resizer = document.createElement("div");
      resizer.className = "image-resize-handle";

      wrapper.appendChild(img);
      wrapper.appendChild(resizer);
      container.appendChild(wrapper);

      let startX = 0;
      let startWidth = 0;
      let isResizing = false;

      const startResize = (e: MouseEvent) => {
        isResizing = true;
        startX = e.pageX;
        startWidth = img.offsetWidth;

        wrapper.classList.add("is-resizing");
        e.preventDefault();
      };

      const resize = (e: MouseEvent) => {
        if (!isResizing) return;

        const diff = e.pageX - startX;
        const newWidth = Math.max(100, startWidth + diff);
        img.style.width = `${newWidth}px`;
      };

      const stopResize = () => {
        if (!isResizing) return;
        isResizing = false;
        wrapper.classList.remove("is-resizing");

        const width = parseInt(img.style.width);
        editor.commands.updateAttributes("image", { width });
      };

      resizer.addEventListener("mousedown", startResize);
      document.addEventListener("mousemove", resize);
      document.addEventListener("mouseup", stopResize);

      return {
        dom: container,
        destroy: () => {
          resizer.removeEventListener("mousedown", startResize);
          document.removeEventListener("mousemove", resize);
          document.removeEventListener("mouseup", stopResize);
        },
      };
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.width,
        renderHTML: (attributes: { width?: string }) => ({
          style: attributes.width ? `width: ${attributes.width}px` : null,
        }),
      },
    };
  },
});

interface EditorProps {
  value: string;
  onChange: (content: string) => void;
  className?: string;
  contextId?: string;
  onPendingImagesChange?: (count: number) => void;
  onPublish?: (content: string) => Promise<void>;
  setPendingPublish?: (isPending: boolean) => void;
}

interface EditorCommands {
  uploadPendingImages: () => Promise<string>;
}

export interface EditorRef {
  uploadPendingImages: () => Promise<string>;
}

interface PendingImage {
  localUrl: string;
  file: File;
  id: string;
}

const Editor = forwardRef<EditorRef, EditorProps>(
  (
    {
      value,
      onChange,
      className = "h-96",
      contextId,
      onPendingImagesChange,
    }: EditorProps,
    ref
  ) => {
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const editorContent = useRef<string>(value);

    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showHighlightPicker, setShowHighlightPicker] = useState(false);
    const [showTableMenu, setShowTableMenu] = useState(false);

    // Color palette for text and highlight
    const colors = [
      { name: 'Default', value: '' },
      { name: 'Red', value: '#ef4444' },
      { name: 'Orange', value: '#f97316' },
      { name: 'Amber', value: '#f59e0b' },
      { name: 'Green', value: '#22c55e' },
      { name: 'Teal', value: '#14b8a6' },
      { name: 'Blue', value: '#3b82f6' },
      { name: 'Indigo', value: '#6366f1' },
      { name: 'Purple', value: '#a855f7' },
      { name: 'Pink', value: '#ec4899' },
      { name: 'Gray', value: '#6b7280' },
    ];

    const highlightColors = [
      { name: 'Yellow', value: '#fef08a' },
      { name: 'Green', value: '#bbf7d0' },
      { name: 'Blue', value: '#bfdbfe' },
      { name: 'Pink', value: '#fbcfe8' },
      { name: 'Orange', value: '#fed7aa' },
      { name: 'Purple', value: '#e9d5ff' },
    ];

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        ResizableImage.configure({
          HTMLAttributes: {
            class: "editor-image",
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-blue-600 hover:underline",
            target: "_blank",
            rel: "noopener noreferrer",
          },
        }),
        Underline,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Highlight.configure({
          multicolor: true,
        }),
        TextStyle,
        Color,
        Subscript,
        Superscript,
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Table.configure({
          resizable: true,
          HTMLAttributes: {
            class: 'editor-table',
          },
        }),
        TableRow,
        TableCell,
        TableHeader,
        Placeholder.configure({
          placeholder: 'Start writing your amazing blog post...',
        }),
      ],
      content: value,
      onUpdate: ({ editor }: { editor: TiptapEditor }) => {
        const html = editor.getHTML();
        editorContent.current = html;
        onChange(html);
      },
    });

    useEffect(() => {
      if (editor && value !== editor.getHTML()) {
        editor.commands.setContent(value);
      }
    }, [value, editor]);

    useEffect(() => {
      onPendingImagesChange?.(pendingImages.length);
    }, [pendingImages, onPendingImagesChange]);

    const uploadImage = async (file: File): Promise<string> => {
      try {
        // Generate a unique ID for the image
        const imageId = `pending-${Date.now()}-${file.name}`;

        // Create a blob URL for preview
        const blob = new Blob([await file.arrayBuffer()], { type: file.type });
        const localUrl = URL.createObjectURL(blob);

        // Cache the image blob
        await imageCache.set(localUrl, blob, localUrl);

        // Add to pending images for later upload
        setPendingImages((prev) => [
          ...prev,
          {
            localUrl,
            file,
            id: imageId,
          },
        ]);

        return localUrl;
      } catch (error) {
        console.error("Error handling image upload:", error);
        throw error;
      }
    };

    const uploadPendingImage = async (
      pendingImage: PendingImage
    ): Promise<string> => {
      try {
        // Get the cached blob
        const cachedBlob = await imageCache.get(pendingImage.localUrl);
        if (!cachedBlob) {
          throw new Error("Image not found in cache");
        }

        const file = new File([cachedBlob], pendingImage.file.name, {
          type: pendingImage.file.type,
        });

        const formData = new FormData();
        formData.append("files", file);
        const id = contextId || `blogs/content-${Date.now()}`;
        formData.append("propertyId", id);

        const response = await fetch("/api/crm/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to upload image");

        const result = await response.json();
        if (!result.success || !result.urls?.[0]) {
          throw new Error("No URL returned from server");
        }

        let imageUrl = result.urls[0];

        // Ensure relative path only (strip domain if present)
        if (imageUrl.includes('://')) {
          const match = imageUrl.match(/\/api\/images\/(.+)$/);
          if (match) {
            imageUrl = `/api/images/${match[1]}`;
          }
        }

        // Cache the uploaded image URL
        await imageCache.set(imageUrl, cachedBlob, imageUrl);

        // Clean up the temporary blob URL
        URL.revokeObjectURL(pendingImage.localUrl);

        return imageUrl;
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Failed to upload image");
        throw error;
      }
    };

    useImperativeHandle<EditorRef, EditorCommands>(ref, () => ({
      uploadPendingImages: async () => {
        if (pendingImages.length === 0) {
          return editorContent.current;
        }
        let content = editorContent.current;

        // Upload all pending images and replace URLs in content
        for (const pendingImage of pendingImages) {
          try {
            // Upload image and get relative path
            const relativePath = await uploadPendingImage(pendingImage);
            // Replace blob URL with full path URL in content
            content = content.replace(pendingImage.localUrl, relativePath);
            URL.revokeObjectURL(pendingImage.localUrl);
          } catch (error) {
            console.error("Error uploading pending image:", error);
          }
        }

        // Clear pending images
        setPendingImages([]);

        editorContent.current = content;
        editor?.commands.setContent(content);
        return content;
      },
    }));

    if (!editor) {
      return null;
    }

    const ToolbarButton = ({
      onClick,
      title,
      isActive = false,
      disabled = false,
      icon: Icon,
    }: {
      onClick: () => void;
      title: string;
      isActive?: boolean;
      disabled?: boolean;
      icon: React.ComponentType<{ className?: string }>;
    }) => (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`
          p-2 rounded-md transition-all duration-200 ease-in-out
          hover:bg-gray-100 hover:shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none
          ${isActive ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-600"}
        `}
        title={title}
      >
        <Icon className="w-4 h-4" />
      </button>
    );

    const ToolbarDivider = () => <div className="h-6 w-px bg-gray-200 mx-1" />;

    // Color picker dropdown component with custom color support
    const ColorPickerDropdown = ({
      isOpen,
      onClose,
      colors: colorOptions,
      onSelect,
      title,
    }: {
      isOpen: boolean;
      onClose: () => void;
      colors: { name: string; value: string }[];
      onSelect: (color: string) => void;
      title: string;
    }) => {
      const [customColor, setCustomColor] = useState('#3b82f6');
      const [hexInput, setHexInput] = useState('');

      if (!isOpen) return null;

      const handleHexSubmit = () => {
        const hex = hexInput.startsWith('#') ? hexInput : `#${hexInput}`;
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
          onSelect(hex);
          onClose();
        } else {
          toast.error('Please enter a valid hex color (e.g., #ff0000)');
        }
      };

      return (
        <div
          className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 min-w-[220px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">{title}</div>

          {/* Preset Colors */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {colorOptions.map((color) => (
              <button
                key={color.name}
                onClick={() => {
                  onSelect(color.value);
                  onClose();
                }}
                className={`
                  w-8 h-8 rounded-lg border-2 transition-all duration-150 group relative
                  hover:scale-110 hover:shadow-lg hover:z-10
                  ${color.value === '' ? 'border-gray-300 bg-white' : 'border-transparent hover:border-gray-400'}
                `}
                style={{ backgroundColor: color.value || 'transparent' }}
                title={color.name}
              >
                {color.value === '' && (
                  <span className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-medium">✕</span>
                )}
                {/* Color name tooltip */}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {color.name}
                </span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-3"></div>

          {/* Custom Color Section */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-500">Custom Color</div>

            {/* Native Color Picker */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-gray-300 transition-colors"
                  style={{ padding: '2px' }}
                />
              </div>
              <button
                onClick={() => {
                  onSelect(customColor);
                  onClose();
                }}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
              >
                Apply Color
              </button>
            </div>

            {/* Hex Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">#</span>
                <input
                  type="text"
                  placeholder="ff0000"
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value.replace('#', '').slice(0, 6))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleHexSubmit();
                    }
                  }}
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                />
              </div>
              <button
                onClick={handleHexSubmit}
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Go
              </button>
            </div>

            {/* Color Preview */}
            {hexInput && /^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hexInput) && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <div
                  className="w-6 h-6 rounded-md border border-gray-200"
                  style={{ backgroundColor: `#${hexInput}` }}
                />
                <span className="text-xs text-gray-600">Preview: #{hexInput}</span>
              </div>
            )}
          </div>
        </div>
      );
    };

    // Table menu dropdown
    const TableMenuDropdown = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
      if (!isOpen) return null;

      const isInTable = editor.isActive('table');

      return (
        <div
          className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-50 min-w-[200px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs font-medium text-gray-500 mb-2 px-2">Table</div>

          {!isInTable ? (
            <button
              onClick={() => {
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Insert 3×3 Table
            </button>
          ) : (
            <>
              <div className="text-xs font-medium text-gray-400 mb-1 px-2 mt-2">Rows</div>
              <button
                onClick={() => { editor.chain().focus().addRowBefore().run(); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <RowsIcon className="w-4 h-4" />
                Add Row Before
              </button>
              <button
                onClick={() => { editor.chain().focus().addRowAfter().run(); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <RowsIcon className="w-4 h-4" />
                Add Row After
              </button>
              <button
                onClick={() => { editor.chain().focus().deleteRow().run(); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Row
              </button>

              <div className="text-xs font-medium text-gray-400 mb-1 px-2 mt-2">Columns</div>
              <button
                onClick={() => { editor.chain().focus().addColumnBefore().run(); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ColumnsIcon className="w-4 h-4" />
                Add Column Before
              </button>
              <button
                onClick={() => { editor.chain().focus().addColumnAfter().run(); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ColumnsIcon className="w-4 h-4" />
                Add Column After
              </button>
              <button
                onClick={() => { editor.chain().focus().deleteColumn().run(); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Column
              </button>

              <div className="border-t border-gray-200 my-2"></div>
              <button
                onClick={() => { editor.chain().focus().toggleHeaderRow().run(); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <TableProperties className="w-4 h-4" />
                Toggle Header Row
              </button>
              <button
                onClick={() => { editor.chain().focus().deleteTable().run(); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Table
              </button>
            </>
          )}
        </div>
      );
    };

    // Close dropdowns when clicking outside
    const handleClickOutside = () => {
      setShowColorPicker(false);
      setShowHighlightPicker(false);
      setShowTableMenu(false);
    };

    return (
      <div className="editor-wrapper h-full" onClick={handleClickOutside}>
        <div className="sticky top-0 z-50">
          <div className="border border-gray-200 bg-gradient-to-b from-gray-50 to-white shadow-sm rounded-t-xl">
            {/* Primary Toolbar Row */}
            <div className="p-2 flex items-center gap-0.5 flex-wrap border-b border-gray-100">
              {/* Undo/Redo */}
              <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Undo (Ctrl+Z)"
                icon={Undo2}
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Redo (Ctrl+Y)"
                icon={Redo2}
              />

              <ToolbarDivider />

              {/* Text Formatting */}
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive("bold")}
                title="Bold (Ctrl+B)"
                icon={Bold}
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive("italic")}
                title="Italic (Ctrl+I)"
                icon={Italic}
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive("underline")}
                title="Underline (Ctrl+U)"
                icon={UnderlineIcon}
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive("strike")}
                title="Strikethrough"
                icon={Strikethrough}
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                isActive={editor.isActive("subscript")}
                title="Subscript"
                icon={SubscriptIcon}
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                isActive={editor.isActive("superscript")}
                title="Superscript"
                icon={SuperscriptIcon}
              />

              <ToolbarDivider />

              {/* Headings */}
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive("heading", { level: 1 })}
                title="Heading 1"
                icon={Heading1}
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive("heading", { level: 2 })}
                title="Heading 2"
                icon={Heading2}
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive("heading", { level: 3 })}
                title="Heading 3"
                icon={Heading3}
              />

              <ToolbarDivider />

              {/* Text Alignment */}
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                title="Align Left"
                icon={AlignLeft}
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                title="Align Center"
                icon={AlignCenter}
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                title="Align Right"
                icon={AlignRight}
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                isActive={editor.isActive({ textAlign: 'justify' })}
                title="Justify"
                icon={AlignJustify}
              />
            </div>

            {/* Secondary Toolbar Row */}
            <div className="p-2 flex items-center gap-0.5 flex-wrap">
              {/* Lists */}
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive("bulletList")}
                title="Bullet List"
                icon={List}
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive("orderedList")}
                title="Numbered List"
                icon={ListOrdered}
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                isActive={editor.isActive("taskList")}
                title="Task List"
                icon={CheckSquare}
              />

              <ToolbarDivider />

              {/* Block Elements */}
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive("blockquote")}
                title="Block Quote"
                icon={Quote}
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editor.isActive("codeBlock")}
                title="Code Block"
                icon={Code}
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Horizontal Rule"
                icon={Minus}
              />

              <ToolbarDivider />

              {/* Text Color */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                    setShowHighlightPicker(false);
                    setShowTableMenu(false);
                  }}
                  className={`
                    p-2 rounded-md transition-all duration-200 ease-in-out flex items-center gap-1
                    hover:bg-gray-100 hover:shadow-sm text-gray-600
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                    ${showColorPicker ? "bg-blue-50 text-blue-600 shadow-sm" : ""}
                  `}
                  title="Text Color"
                >
                  <Palette className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
                </button>
                <ColorPickerDropdown
                  isOpen={showColorPicker}
                  onClose={() => setShowColorPicker(false)}
                  colors={colors}
                  onSelect={(color) => {
                    if (color) {
                      editor.chain().focus().setColor(color).run();
                    } else {
                      editor.chain().focus().unsetColor().run();
                    }
                  }}
                  title="Text Color"
                />
              </div>

              {/* Highlight Color */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHighlightPicker(!showHighlightPicker);
                    setShowColorPicker(false);
                    setShowTableMenu(false);
                  }}
                  className={`
                    p-2 rounded-md transition-all duration-200 ease-in-out flex items-center gap-1
                    hover:bg-gray-100 hover:shadow-sm text-gray-600
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                    ${showHighlightPicker ? "bg-blue-50 text-blue-600 shadow-sm" : ""}
                    ${editor.isActive("highlight") ? "bg-yellow-100" : ""}
                  `}
                  title="Highlight"
                >
                  <Highlighter className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
                </button>
                <ColorPickerDropdown
                  isOpen={showHighlightPicker}
                  onClose={() => setShowHighlightPicker(false)}
                  colors={[{ name: 'Remove', value: '' }, ...highlightColors]}
                  onSelect={(color) => {
                    if (color) {
                      editor.chain().focus().toggleHighlight({ color }).run();
                    } else {
                      editor.chain().focus().unsetHighlight().run();
                    }
                  }}
                  title="Highlight Color"
                />
              </div>

              <ToolbarDivider />

              {/* Table */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTableMenu(!showTableMenu);
                    setShowColorPicker(false);
                    setShowHighlightPicker(false);
                  }}
                  className={`
                    p-2 rounded-md transition-all duration-200 ease-in-out flex items-center gap-1
                    hover:bg-gray-100 hover:shadow-sm text-gray-600
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                    ${showTableMenu ? "bg-blue-50 text-blue-600 shadow-sm" : ""}
                    ${editor.isActive("table") ? "bg-blue-50 text-blue-600" : ""}
                  `}
                  title="Table"
                >
                  <TableIcon className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
                </button>
                <TableMenuDropdown
                  isOpen={showTableMenu}
                  onClose={() => setShowTableMenu(false)}
                />
              </div>

              <ToolbarDivider />

              {/* Links */}
              <ToolbarButton
                onClick={() => {
                  const url = editor.isActive("link")
                    ? false
                    : window.prompt("Enter URL:");

                  if (url === false) {
                    editor.chain().focus().unsetLink().run();
                  } else if (url) {
                    try {
                      const formattedUrl = url.startsWith("http")
                        ? url
                        : `https://${url}`;
                      new URL(formattedUrl);
                      editor
                        .chain()
                        .focus()
                        .setLink({ href: formattedUrl })
                        .run();
                    } catch {
                      toast.error("Please enter a valid URL");
                    }
                  }
                }}
                isActive={editor.isActive("link")}
                title={editor.isActive("link") ? "Remove Link" : "Insert Link"}
                icon={LinkIcon}
              />

              {/* Images */}
              <label
                className={`
                  p-2 rounded-md transition-all duration-200 ease-in-out cursor-pointer
                  hover:bg-gray-100 hover:shadow-sm text-gray-600
                  focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50
                `}
                title="Insert Image"
              >
                <ImageIcon className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Image size must be less than 5MB");
                        return;
                      }

                      const localUrl = await uploadImage(file);
                      editor.chain().focus().setImage({ src: localUrl }).run();
                      onPendingImagesChange?.(pendingImages.length + 1);
                    } catch (error) {
                      console.error("Error handling image:", error);
                      toast.error("Failed to add image");
                    }
                  }}
                />
              </label>

              <ToolbarDivider />

              {/* Clear Formatting */}
              <ToolbarButton
                onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                title="Clear Formatting"
                icon={RemoveFormatting}
              />
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div
          className="border border-gray-200 border-t-0 rounded-b-xl bg-white shadow-sm overflow-auto"
          style={{ height: "calc(100% - 110px)" }}
        >
          <EditorContent
            editor={editor}
            className={`
              prose max-w-none p-6 min-h-full focus:outline-none
              ${className}
            `}
          />
        </div>

        <style jsx global>{`
          .editor-wrapper {
            height: 100%;
            display: flex;
            flex-direction: column;
          }

          .editor-wrapper .ProseMirror {
            outline: none;
            min-height: 100%;
          }

          /* Placeholder */
          .editor-wrapper .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #9ca3af;
            pointer-events: none;
            height: 0;
            font-style: italic;
          }

          .editor-wrapper .ProseMirror p {
            margin: 1em 0;
          }

          .editor-wrapper .ProseMirror > p:first-child {
            margin-top: 0;
          }

          .editor-wrapper .ProseMirror > p:last-child {
            margin-bottom: 0;
          }

          /* Headings */
          .editor-wrapper .ProseMirror h1 {
            font-size: 2em;
            font-weight: 700;
            line-height: 1.2;
            margin: 1.5em 0 0.5em;
            color: #111827;
          }

          .editor-wrapper .ProseMirror h2 {
            font-size: 1.5em;
            font-weight: 600;
            line-height: 1.3;
            margin: 1.5em 0 0.5em;
            color: #1f2937;
          }

          .editor-wrapper .ProseMirror h3 {
            font-size: 1.25em;
            font-weight: 600;
            line-height: 1.3;
            margin: 1.2em 0 0.5em;
            color: #374151;
          }

          /* Lists */
          .editor-wrapper .ProseMirror ul {
            list-style-type: disc;
            padding-left: 1.5em;
            margin: 1em 0;
          }

          .editor-wrapper .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 1.5em;
            margin: 1em 0;
          }

          .editor-wrapper .ProseMirror li {
            margin: 0.5em 0;
            position: relative;
          }

          /* Task List */
          .editor-wrapper .ProseMirror ul[data-type="taskList"] {
            list-style: none;
            padding-left: 0.5em;
          }

          .editor-wrapper .ProseMirror ul[data-type="taskList"] li {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .editor-wrapper .ProseMirror ul[data-type="taskList"] li > label {
            flex-shrink: 0;
            user-select: none;
          }

          .editor-wrapper .ProseMirror ul[data-type="taskList"] li > label > input[type="checkbox"] {
            width: 1.125rem;
            height: 1.125rem;
            margin-top: 0.25rem;
            cursor: pointer;
            accent-color: #3b82f6;
            border-radius: 4px;
          }

          .editor-wrapper .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div {
            text-decoration: line-through;
            color: #9ca3af;
          }

          /* Blockquote */
          .editor-wrapper .ProseMirror blockquote {
            border-left: 4px solid #e5e7eb;
            margin: 1.5em 0;
            padding: 0.5em 0 0.5em 1.5em;
            background: linear-gradient(to right, #f9fafb, transparent);
            border-radius: 0 0.5rem 0.5rem 0;
            font-style: italic;
            color: #4b5563;
          }

          .editor-wrapper .ProseMirror blockquote p {
            margin: 0.5em 0;
          }

          /* Code Block */
          .editor-wrapper .ProseMirror pre {
            background: #1f2937;
            color: #e5e7eb;
            font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
            padding: 1rem 1.25rem;
            border-radius: 0.75rem;
            margin: 1.5em 0;
            overflow-x: auto;
            font-size: 0.875em;
            line-height: 1.7;
          }

          .editor-wrapper .ProseMirror pre code {
            color: inherit;
            padding: 0;
            background: none;
            font-size: inherit;
          }

          /* Inline Code */
          .editor-wrapper .ProseMirror code {
            background: #f3f4f6;
            color: #ef4444;
            padding: 0.2em 0.4em;
            border-radius: 0.25rem;
            font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
            font-size: 0.875em;
          }

          /* Horizontal Rule */
          .editor-wrapper .ProseMirror hr {
            border: none;
            height: 2px;
            background: linear-gradient(to right, transparent, #e5e7eb, transparent);
            margin: 2em 0;
          }

          /* Links */
          .editor-wrapper .ProseMirror a {
            color: #2563eb;
            text-decoration: none;
            transition: color 0.2s;
            border-bottom: 1px solid transparent;
          }

          .editor-wrapper .ProseMirror a:hover {
            color: #1d4ed8;
            border-bottom-color: #1d4ed8;
          }

          /* Strikethrough */
          .editor-wrapper .ProseMirror s {
            text-decoration: line-through;
            color: #9ca3af;
          }

          /* Subscript & Superscript */
          .editor-wrapper .ProseMirror sub {
            font-size: 0.75em;
            vertical-align: sub;
          }

          .editor-wrapper .ProseMirror sup {
            font-size: 0.75em;
            vertical-align: super;
          }

          /* Tables */
          .editor-wrapper .ProseMirror table {
            border-collapse: collapse;
            margin: 1.5em 0;
            overflow: hidden;
            table-layout: fixed;
            width: 100%;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
          }

          .editor-wrapper .ProseMirror td,
          .editor-wrapper .ProseMirror th {
            border: 1px solid #e5e7eb;
            box-sizing: border-box;
            min-width: 1em;
            padding: 0.75rem 1rem;
            position: relative;
            vertical-align: top;
          }

          .editor-wrapper .ProseMirror th {
            background-color: #f9fafb;
            font-weight: 600;
            text-align: left;
            color: #374151;
          }

          .editor-wrapper .ProseMirror tr:hover td {
            background-color: #f9fafb;
          }

          .editor-wrapper .ProseMirror .selectedCell:after {
            background: rgba(59, 130, 246, 0.1);
            content: "";
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            pointer-events: none;
            position: absolute;
            z-index: 2;
          }

          .editor-wrapper .ProseMirror .column-resize-handle {
            background-color: #3b82f6;
            bottom: -2px;
            position: absolute;
            right: -2px;
            pointer-events: none;
            top: 0;
            width: 4px;
          }

          .editor-wrapper .ProseMirror.resize-cursor {
            cursor: col-resize;
          }

          /* Text Alignment */
          .editor-wrapper .ProseMirror [style*="text-align: left"] {
            text-align: left;
          }
          .editor-wrapper .ProseMirror [style*="text-align: center"] {
            text-align: center;
          }
          .editor-wrapper .ProseMirror [style*="text-align: right"] {
            text-align: right;
          }
          .editor-wrapper .ProseMirror [style*="text-align: justify"] {
            text-align: justify;
          }

          /* Highlight */
          .editor-wrapper .ProseMirror mark {
            border-radius: 0.25em;
            padding: 0.125em 0.25em;
          }

          /* Images */
          .image-container {
            position: relative;
            display: inline-block;
            margin: 1em 0;
          }

          .image-wrapper {
            position: relative;
            display: inline-block;
          }

          .image-wrapper.is-resizing {
            user-select: none;
          }

          .editor-image {
            display: block;
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .image-resize-handle {
            position: absolute;
            right: -6px;
            top: 50%;
            transform: translateY(-50%);
            width: 12px;
            height: 12px;
            background-color: #3b82f6;
            border: 2px solid white;
            border-radius: 50%;
            cursor: ew-resize;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 10;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .image-wrapper:hover .image-resize-handle {
            opacity: 1;
          }

          .image-wrapper.is-resizing .image-resize-handle {
            opacity: 1;
          }

          .image-wrapper.is-resizing .editor-image {
            pointer-events: none;
          }

          /* Selection styling */
          .editor-wrapper .ProseMirror ::selection {
            background: rgba(59, 130, 246, 0.2);
          }

          /* Focus indicator for entire editor */
          .editor-wrapper .ProseMirror-focused {
            outline: none;
          }
        `}</style>
      </div>
    );
  }
);

Editor.displayName = "Editor";

export default Editor;
