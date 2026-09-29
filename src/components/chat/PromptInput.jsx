import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, Wand2, Plus } from 'lucide-react';

const CREATION_SUGGESTIONS = [
  "Desk nameplate with the name Denny",
  "Honeycomb pen & tool organizer",
  "Mechanical spur gear with axle bore",
  "Heavy duty 90° mounting bracket",
  "Cylindrical desk organizer cup"
];

const EDIT_SUGGESTIONS = [
  "Make it 20mm taller",
  "Add 4 mounting screw holes",
  "Increase wall thickness by 1.5mm",
  "Add rounded beveled edges",
  "Widen the base by 15mm"
];

export default function PromptInput({ 
  onSend, 
  isLoading, 
  hasActiveModel,
  activeModelTitle,
  onNewSession
}) {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [prompt]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSend(prompt.trim());
    setPrompt('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (sug) => {
    setPrompt(sug);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const activeSuggestions = hasActiveModel ? EDIT_SUGGESTIONS : CREATION_SUGGESTIONS;

  return (
    <div className="w-full flex flex-col gap-2 p-3 bg-white border-t border-gray-200 select-none">
      {/* Suggestions Pills */}
      {prompt.length === 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          <div className="flex items-center gap-1 text-gray-500 font-medium whitespace-nowrap pl-1 pr-1">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>{hasActiveModel ? "Edit Ideas:" : "Try:"}</span>
          </div>
          {activeSuggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(sug)}
              className="px-2.5 py-1 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 whitespace-nowrap transition-all"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Input box */}
      <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 focus-within:border-blue-400 rounded-2xl p-2 transition-all shadow-sm">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            hasActiveModel 
              ? "Describe modifications to this shape (e.g. 'Make it 20mm taller', 'Add 4 screw holes')..."
              : "Describe a 3D object to compile (e.g. 'Parametric phone stand with cable cutout')..."
          }
          rows={1}
          disabled={isLoading}
          className="flex-1 bg-transparent border-0 text-xs md:text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none px-2 py-1 max-h-[140px]"
        />

        <button
          type="submit"
          disabled={!prompt.trim() || isLoading}
          className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
            prompt.trim() && !isLoading
              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title="Send Prompt (Enter)"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>

      <div className="flex items-center justify-between text-[10px] text-gray-400 px-1 font-mono">
        <span>Press <kbd className="px-1 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-500">Enter</kbd> to {hasActiveModel ? "edit shape" : "compile"}, <kbd className="px-1 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-500">Shift+Enter</kbd> for newline</span>
        <span>{hasActiveModel ? "Conversational Shape Editor" : "Deterministic CSG Compiler"}</span>
      </div>
    </div>
  );
}
