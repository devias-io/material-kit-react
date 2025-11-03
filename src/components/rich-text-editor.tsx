'use client';

import React from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  style?: React.CSSProperties;
  label?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Digite o conteúdo... (você pode usar negrito, itálico, listas, links e imagens)',
  minHeight = '150px',
  style,
  label
}: RichTextEditorProps): React.JSX.Element {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const [formatState, setFormatState] = React.useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false
  });
  const shouldShowPlaceholder = React.useMemo(() => {
    const textContent = value
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .trim();

    return textContent.length === 0;
  }, [value]);

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const updateFormatState = React.useCallback(() => {
    setFormatState({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strike: document.queryCommandState('strikeThrough')
    });
  }, []);

  const execCommand = React.useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      updateFormatState();

      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    },
    [onChange, updateFormatState]
  );

  const insertLink = React.useCallback(() => {
    const url = prompt('Digite o endereço do link (inclua https://):');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  const insertImage = React.useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = loadEvent => {
          const imageUrl = loadEvent.target?.result as string;

          const img = document.createElement('img');
          img.src = imageUrl;
          img.style.maxWidth = '100%';
          img.style.borderRadius = '8px';
          img.style.margin = '8px 0';

          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.insertNode(img);
            range.collapse(false);
          }

          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  }, [onChange]);

  const handleInput = React.useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const baseButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid #cbd5f5',
    borderRadius: '6px',
    padding: '6px 10px',
    color: '#1e293b',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const renderButton = (
    label: string,
    command: string,
    isActive: boolean,
    onClick?: () => void
  ) => (
    <button
      type="button"
      onClick={onClick ?? (() => execCommand(command))}
      style={{
        ...baseButtonStyle,
        backgroundColor: isActive ? '#eef2ff' : 'transparent',
        borderColor: isActive ? '#6366f1' : '#cbd5f5'
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
      {label && (
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{label}</span>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '8px 0'
        }}
      >
        {renderButton('N', 'bold', formatState.bold)}
        {renderButton('I', 'italic', formatState.italic)}
        {renderButton('S', 'underline', formatState.underline)}
        {renderButton('abc', 'strikeThrough', formatState.strike)}
        {renderButton('Lista', 'insertUnorderedList', false)}
        {renderButton('Num.', 'insertOrderedList', false)}
        {renderButton('Link', 'createLink', false, insertLink)}
        {renderButton('Imagem', 'insertImage', false, insertImage)}
        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          style={{ ...baseButtonStyle, color: '#ef4444', borderColor: '#fecaca' }}
        >
          Limpar
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        {shouldShowPlaceholder && !isFocused && (
          <span
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              right: '16px',
              color: '#94a3b8',
              fontSize: '14px',
              pointerEvents: 'none'
            }}
          >
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => {
            setIsFocused(true);
            updateFormatState();
          }}
          onBlur={() => setIsFocused(false)}
          onInput={handleInput}
          onKeyUp={updateFormatState}
          onMouseUp={updateFormatState}
          style={{
            border: `2px solid ${isFocused ? '#6366f1' : '#cbd5f5'}`,
            borderRadius: '12px',
            padding: '16px',
            minHeight,
            backgroundColor: '#ffffff',
            fontSize: '14px',
            lineHeight: 1.6,
            color: '#0f172a',
            transition: 'border 0.2s ease',
            outline: 'none'
          }}
        />
      </div>
    </div>
  );
}
