import React, { useState } from 'react';
import { X, Copy, Check, Play, RefreshCw, Code } from 'lucide-react';

export default function CodeViewer({ 
  isOpen, 
  onClose, 
  scadCode, 
  onRecompileCode,
  isRecompiling 
}) {
  if (!isOpen) return null;

  const [code, setCode] = useState(scadCode || '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecompile = () => {
    if (onRecompileCode) {
      onRecompileCode(code);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#10141d] border border-white/10 rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0b0e14]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">OpenSCAD Procedural Source</h3>
              <p className="text-[11px] text-slate-400">Deterministic CSG Solid Geometry Script</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleRecompile}
              disabled={isRecompiling}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecompiling ? 'animate-spin' : ''}`} />
              <span>{isRecompiling ? 'Compiling...' : 'Recompile CSG'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 p-4 bg-[#080a0f] overflow-hidden flex flex-col font-mono text-xs">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck="false"
            className="w-full h-full bg-transparent text-cyan-100 border-0 focus:outline-none resize-none leading-relaxed selection:bg-cyan-500/30 selection:text-white"
          />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#0b0e14] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Variables inside <code className="text-cyan-400 font-semibold">/* [Parameters] */</code> automatically sync with UI sliders</span>
          <span>OpenSCAD 2-Manifold Kernel</span>
        </div>
      </div>
    </div>
  );
}
