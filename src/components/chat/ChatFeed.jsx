import React, { useRef, useEffect, useState } from 'react';
import { 
  Bot, 
  User, 
  Box, 
  Code, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Sparkles, 
  Maximize2, 
  Scale, 
  Clock, 
  Wand2,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';
import { getDownloadUrl } from '../../services/api';

export default function ChatFeed({ 
  messages = [], 
  isLoading, 
  currentSteps = [], 
  onSelectModel,
  onRefineModel,
  onOpenCode
}) {
  const feedEndRef = useRef(null);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [expandedReasoning, setExpandedReasoning] = useState({});

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, currentSteps]);

  const toggleReasoning = (msgId) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleCopyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto h-full min-h-0">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
          <Box className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          PromptCAD
        </h2>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.map((msg) => (
        <div key={msg.id} className="space-y-3">
          {/* User Message */}
          {msg.role === 'user' ? (
            <div className="flex items-start gap-3 justify-end">
              <div className="max-w-[85%] bg-gray-100 text-gray-900 rounded-3xl rounded-tr-sm px-4 py-3 text-xs md:text-sm">
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          ) : (
            /* Assistant Message */
            <div className="flex items-start gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>

              <div className="max-w-[90%] flex flex-col gap-3">
                {/* Reasoning Accordion */}
                {msg.reasoning_steps && msg.reasoning_steps.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden text-xs">
                    <button
                      onClick={() => toggleReasoning(msg.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <span className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        AI Reasoning Steps ({msg.reasoning_steps.length})
                      </span>
                      {expandedReasoning[msg.id] ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {expandedReasoning[msg.id] && (
                      <div className="px-3 pb-2.5 pt-1 space-y-1.5 border-t border-gray-200 text-[11px] font-mono text-gray-500">
                        {msg.reasoning_steps.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Text Content / Error Feedback Message */}
                {msg.content && !msg.modelData && (
                  <div className={`text-xs md:text-sm leading-relaxed ${
                    msg.content.toLowerCase().includes('error') || msg.content.toLowerCase().includes('failed')
                      ? 'p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 shadow-sm'
                      : 'text-gray-800'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      {msg.content.toLowerCase().includes('error') && (
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                )}

                {/* Model Result Card */}
                {msg.modelData && (
                  <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3 shadow-sm w-full">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                          <Box className="w-4 h-4 text-blue-600" />
                          {msg.modelData.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {msg.modelData.description}
                        </p>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-green-50 text-green-700 border border-green-200 shrink-0">
                        2-Manifold STL
                      </span>
                    </div>

                    {/* Quick Telemetry Chips */}
                    {msg.modelData.telemetry && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-gray-600">
                        <span className="bg-gray-50 px-2 py-1 rounded-md border border-gray-200 flex items-center gap-1">
                          <Maximize2 className="w-3 h-3 text-blue-500" />
                          {msg.modelData.telemetry.bounding_box_mm.join(' × ')} mm
                        </span>
                        <span className="bg-gray-50 px-2 py-1 rounded-md border border-gray-200 flex items-center gap-1">
                          <Scale className="w-3 h-3 text-amber-500" />
                          {msg.modelData.telemetry.filament_mass_grams}g PLA
                        </span>
                        <span className="bg-gray-50 px-2 py-1 rounded-md border border-gray-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          ~{msg.modelData.telemetry.estimated_print_time_mins} min
                        </span>
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => onSelectModel(msg.modelData)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium flex items-center gap-1.5 transition-all"
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>Inspect in 3D</span>
                      </button>

                      <button
                        onClick={() => onOpenCode(msg.modelData.scad_code)}
                        className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium flex items-center gap-1.5 transition-all"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>OpenSCAD Code</span>
                      </button>

                      <a
                        href={getDownloadUrl(msg.modelData.model_id)}
                        download
                        className="ml-auto px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium flex items-center gap-1.5 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export STL</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* In-Flight Generation Progress Card */}
      {isLoading && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 animate-pulse">
            <Bot className="w-4 h-4 text-white" />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm max-w-[85%] space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>Generating CSG...</span>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono text-gray-500">
              {currentSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={feedEndRef} />
    </div>
  );
}
