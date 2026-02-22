import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RichTextEditor = ({ content, onChange, onContentAnalysis }) => {
  const [editorContent, setEditorContent] = useState(content || '');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [formatMenuPosition, setFormatMenuPosition] = useState({ x: 0, y: 0 });
  const editorRef = useRef(null);
  const formatMenuRef = useRef(null);

  const formatOptions = [
    { name: 'Gras', command: 'bold', icon: 'Bold', shortcut: 'Ctrl+B' },
    { name: 'Italique', command: 'italic', icon: 'Italic', shortcut: 'Ctrl+I' },
    { name: 'Soulignement', command: 'underline', icon: 'Underline', shortcut: 'Ctrl+U' },
    { name: 'Titre 1', command: 'formatBlock', value: 'h1', icon: 'Heading1' },
    { name: 'Titre 2', command: 'formatBlock', value: 'h2', icon: 'Heading2' },
    { name: 'Titre 3', command: 'formatBlock', value: 'h3', icon: 'Heading3' },
    { name: 'Paragraphe', command: 'formatBlock', value: 'p', icon: 'Type' },
    { name: 'Citation', command: 'formatBlock', value: 'blockquote', icon: 'Quote' }
  ];

  const quickActions = [
    { name: 'Annuler', command: 'undo', icon: 'Undo', shortcut: 'Ctrl+Z' },
    { name: 'Refaire', command: 'redo', icon: 'Redo', shortcut: 'Ctrl+Y' },
    { name: 'Couper', command: 'cut', icon: 'Scissors', shortcut: 'Ctrl+X' },
    { name: 'Copier', command: 'copy', icon: 'Copy', shortcut: 'Ctrl+C' },
    { name: 'Coller', command: 'paste', icon: 'Clipboard', shortcut: 'Ctrl+V' }
  ];

  useEffect(() => {
    const text = editorContent?.replace(/<[^>]*>/g, '');
    const words = text?.trim() ? text?.trim()?.split(/\s+/)?.length : 0;
    const characters = text?.length;
    
    setWordCount(words);
    setCharacterCount(characters);
    
    if (onChange) {
      onChange(editorContent);
    }
    
    if (onContentAnalysis && words > 0) {
      onContentAnalysis({
        wordCount: words,
        characterCount: characters,
        contentType: words > 500 ? 'article' : words > 100 ? 'short-article' : 'caption',
        language: 'fr'
      });
    }
  }, [editorContent, onChange, onContentAnalysis]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount > 0 && !selection?.isCollapsed) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      setSelectedText(selection?.toString());
      setFormatMenuPosition({
        x: rect?.left + rect?.width / 2,
        y: rect?.top - 10
      });
      setShowFormatMenu(true);
    } else {
      setShowFormatMenu(false);
      setSelectedText('');
    }
  };

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef?.current?.focus();
    setShowFormatMenu(false);
  };

  const handlePasteFromWord = (e) => {
    e?.preventDefault();
    const paste = e?.clipboardData?.getData('text/html') || e?.clipboardData?.getData('text/plain');
    
    // Clean Word formatting
    let cleanedContent = paste?.replace(/<o:p\s*\/?>|<\/o:p>/gi, '')?.replace(/<span[^>]*font-family[^>]*>([^<]*)<\/span>/gi, '$1')?.replace(/style="[^"]*"/gi, '')?.replace(/<(\/?)w:[^>]*>/gi, '')?.replace(/<!--[\s\S]*?-->/gi, '');
    
    document.execCommand('insertHTML', false, cleanedContent);
  };

  const handleKeyDown = (e) => {
    // Handle keyboard shortcuts
    if (e?.ctrlKey || e?.metaKey) {
      switch (e?.key) {
        case 'b':
          e?.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e?.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e?.preventDefault();
          executeCommand('underline');
          break;
        case 's':
          e?.preventDefault();
          // Auto-save functionality would be triggered here
          break;
      }
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-border p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Actions */}
          <div className="flex items-center gap-1 pr-3 border-r border-border">
            {quickActions?.map((action) => (
              <Button
                key={action?.command}
                variant="ghost"
                size="sm"
                onClick={() => executeCommand(action?.command)}
                iconName={action?.icon}
                iconSize={16}
                title={`${action?.name} (${action?.shortcut})`}
                className="h-8 w-8 p-0"
              />
            ))}
          </div>

          {/* Format Options */}
          <div className="flex items-center gap-1">
            {formatOptions?.slice(0, 3)?.map((option) => (
              <Button
                key={option?.command}
                variant="ghost"
                size="sm"
                onClick={() => executeCommand(option?.command, option?.value)}
                iconName={option?.icon}
                iconSize={16}
                title={`${option?.name} ${option?.shortcut ? `(${option?.shortcut})` : ''}`}
                className="h-8 w-8 p-0"
              />
            ))}
          </div>

          {/* Heading Options */}
          <div className="flex items-center gap-1 pl-3 border-l border-border">
            {formatOptions?.slice(3)?.map((option) => (
              <Button
                key={`${option?.command}-${option?.value}`}
                variant="ghost"
                size="sm"
                onClick={() => executeCommand(option?.command, option?.value)}
                iconName={option?.icon}
                iconSize={16}
                title={option?.name}
                className="h-8 w-8 p-0"
              />
            ))}
          </div>
        </div>
      </div>
      {/* Editor Area */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          className="min-h-96 p-6 focus:outline-none text-foreground leading-relaxed"
          style={{ fontFamily: 'Inter, sans-serif' }}
          onInput={(e) => setEditorContent(e?.target?.innerHTML)}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          onKeyDown={handleKeyDown}
          onPaste={handlePasteFromWord}
          dangerouslySetInnerHTML={{ __html: editorContent }}
          spellCheck="true"
          lang="fr"
        />

        {/* Floating Format Menu */}
        {showFormatMenu && selectedText && (
          <div
            ref={formatMenuRef}
            className="fixed z-50 bg-popover border border-border rounded-lg shadow-modal p-2 flex items-center gap-1 animate-fade-in"
            style={{
              left: `${formatMenuPosition?.x}px`,
              top: `${formatMenuPosition?.y}px`,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
          >
            {formatOptions?.slice(0, 3)?.map((option) => (
              <Button
                key={option?.command}
                variant="ghost"
                size="sm"
                onClick={() => executeCommand(option?.command, option?.value)}
                iconName={option?.icon}
                iconSize={14}
                className="h-7 w-7 p-0"
              />
            ))}
          </div>
        )}
      </div>
      {/* Status Bar */}
      <div className="border-t border-border px-6 py-3 bg-muted/30">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{wordCount} mots</span>
            <span>{characterCount} caractères</span>
            <span className="flex items-center gap-1">
              <Icon name="CheckCircle" size={14} className="text-success" />
              Sauvegardé automatiquement
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Français (FR)</span>
            <Icon name="Globe" size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;