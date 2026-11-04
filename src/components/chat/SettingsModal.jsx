import React, { useState } from 'react';
import { X, Key, Check, Sparkles, ExternalLink } from 'lucide-react';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  onSaveKeys,
  backendStatus 
}) {
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('promptcad_gemini_key') || '');
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('promptcad_openai_key') || '');
  const [provider, setProvider] = useState(() => localStorage.getItem('promptcad_provider') || 'gemini');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('promptcad_gemini_key', geminiKey.trim());
    localStorage.setItem('promptcad_openai_key', openaiKey.trim());
    localStorage.setItem('promptcad_provider', provider);

    if (onSaveKeys) {
      onSaveKeys({
        gemini_api_key: geminiKey.trim(),
        openai_api_key: openaiKey.trim(),
        provider
      });
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#10141d] border border-white/10 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0b0e14]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Engine Configuration</h3>
              <p className="text-[11px] text-slate-400">Connect Gemini or OpenAI for generative 3D modeling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* Provider Selection */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Default AI Provider</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  provider === 'gemini'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Google Gemini</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  provider === 'openai'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>OpenAI GPT-4o</span>
              </button>
            </div>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium">Gemini API Key</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full bg-[#0a0d13] border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono text-xs"
            />
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium">OpenAI API Key (Optional)</label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Get Key</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="w-full bg-[#0a0d13] border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono text-xs"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-[11px] text-slate-400 leading-relaxed">
            💡 <strong>Smart Procedural Synthesizer:</strong> When no API key is entered, the studio uses custom procedural CSG algorithms to generate 3D nameplates with embossed text, gears, desk organizers, brackets, and boxes!
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#0b0e14] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{saved ? 'Saved!' : 'Save Keys'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
