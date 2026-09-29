import React, { useState, useEffect, useRef } from 'react';
import Header from './components/common/Header';
import ChatSidebar from './components/chat/ChatSidebar';
import ChatFeed from './components/chat/ChatFeed';
import PromptInput from './components/chat/PromptInput';
import CADViewport from './components/viewport/CADViewport';
import ParameterSliders from './components/controls/ParameterSliders';
import CodeViewer from './components/chat/CodeViewer';
import SettingsModal from './components/chat/SettingsModal';

import { 
  checkHealth, 
  generateModel, 
  refineModel, 
  recompileModel,
  saveApiKeys
} from './services/api';
import { Sliders, ChevronDown, ChevronUp, AlertTriangle, X, PanelRightClose, PanelRightOpen } from 'lucide-react';

export default function App() {
  // Session & Chat State
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('promptcad_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Active 3D Model State
  const [activeModel, setActiveModel] = useState(null);
  const [infillPercent, setInfillPercent] = useState(20);

  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isParametersOpen, setIsParametersOpen] = useState(true);
  const [isPreviewMinimized, setIsPreviewMinimized] = useState(false);

  // Loading & In-Flight Status
  const [isLoading, setIsLoading] = useState(false);
  const [isRecompiling, setIsRecompiling] = useState(false);
  const [currentSteps, setCurrentSteps] = useState([]);
  const [toastError, setToastError] = useState(null);

  const showError = (msg) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 6000);
  };

  // System
  const [backendStatus, setBackendStatus] = useState(null);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('promptcad_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Initial Fetch: Backend Health check only
  useEffect(() => {
    const initSystem = async () => {
      try {
        const health = await checkHealth();
        setBackendStatus(health);
      } catch (e) {
        console.warn("Backend health check failed:", e);
      }
    };
    initSystem();
  }, []);

  // Handle New Session
  const handleNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
    setActiveModel(null);
  };

  // Select Existing Session
  const handleSelectSession = (id) => {
    const sess = sessions.find(s => s.id === id);
    if (sess) {
      setActiveSessionId(sess.id);
      setMessages(sess.messages || []);
      setActiveModel(sess.activeModel || null);
    }
  };

  // Delete Session
  const handleDeleteSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      handleNewSession();
    }
  };

  // Handle Save API Keys
  const handleSaveKeys = async (keys) => {
    try {
      await saveApiKeys(keys);
      const health = await checkHealth();
      setBackendStatus(health);
    } catch (e) {
      console.warn("Failed to update backend keys:", e);
    }
  };

  // Handle Prompt Submission (Generate or Refine)
  const handleSendPrompt = async (promptText) => {
    if (!promptText.trim()) return;

    const provider = localStorage.getItem('promptcad_provider') || 'gemini';
    const apiKey = provider === 'gemini' 
      ? localStorage.getItem('promptcad_gemini_key') 
      : localStorage.getItem('promptcad_openai_key');

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: promptText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const isEditing = Boolean(activeModel && activeModel.scad_code);

    try {
      let result;
      if (isEditing) {
        // Edit and update the corresponding shape in this chat session
        setCurrentSteps([
          `Analyzing edit instructions: "${promptText}"`,
          "Interpreting modifications to active 3D geometry...",
          "Applying shape edits via Gemini...",
          "Compiling updated watertight STL mesh..."
        ]);
        result = await refineModel(
          activeModel.model_id, 
          promptText, 
          activeModel.scad_code, 
          infillPercent,
          apiKey,
          provider
        );
      } else {
        // Initial creation for a brand new project session
        setCurrentSteps([
          `Analyzing prompt requirements: "${promptText}"`,
          "Synthesizing CSG primitives via Gemini...",
          "Validating 2-manifold boundaries and bed limits...",
          "Compiling initial watertight STL mesh..."
        ]);
        result = await generateModel(
          promptText, 
          infillPercent,
          apiKey,
          provider
        );
      }



      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isEditing 
          ? `Updated 3D model: ${result.title}` 
          : `Compiled 3D solid model: ${result.title}`,
        modelData: result,
        reasoning_steps: result.reasoning_steps || [],
        timestamp: new Date().toISOString()
      };

      result.localTimestamp = Date.now();
      const updatedMessages = [...messages, userMsg, assistantMsg];
      setMessages(updatedMessages);
      setActiveModel(result);
      setIsParametersOpen(true);

      const sessId = activeSessionId || Date.now().toString();
      setActiveSessionId(sessId);
      setSessions(prev => {
        const existingSession = prev.find(s => s.id === sessId);
        const sessionTitle = (isEditing && existingSession?.title) ? existingSession.title : result.title;
        const filtered = prev.filter(s => s.id !== sessId);
        return [
          {
            id: sessId,
            title: sessionTitle,
            messages: updatedMessages,
            activeModel: result,
            updatedAt: new Date().toISOString()
          },
          ...filtered
        ];
      });

    } catch (err) {
      console.error("Error during generation:", err);
      const errMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error compiling geometry: ${err.message}`,
        reasoning_steps: [
          `Failed to process modification: ${err.message}`,
          "Please verify prompt details or try a different adjustment instruction."
        ],
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      setCurrentSteps([]);
    }
  };

  // Handle Parametric Slider Updates
  const handleUpdateParameters = async (overrides) => {
    if (!activeModel) return;

    setIsRecompiling(true);
    try {
      const result = await recompileModel(
        activeModel.model_id,
        activeModel.scad_code,
        overrides,
        infillPercent
      );

      result.localTimestamp = Date.now();
      setActiveModel(result);

      setMessages(prev => 
        prev.map(m => m.modelData?.model_id === activeModel.model_id 
          ? { ...m, modelData: result } 
          : m
        )
      );

      if (activeSessionId) {
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, activeModel: result } : s));
      }
    } catch (err) {
      console.error("Recompilation error:", err);
      showError(`Recompilation notice: ${err.message}`);
    } finally {
      setIsRecompiling(false);
    }
  };

  // Handle Infill Percentage Change
  const handleInfillChange = (val) => {
    setInfillPercent(val);
    if (activeModel?.telemetry) {
      const vol = activeModel.telemetry.volume_cm3;
      const factor = 0.35 + 0.65 * (val / 100.0);
      const mass = Math.round(vol * 1.24 * factor * 10) / 10;
      const cost = Math.round((mass / 1000.0) * 22.0 * 100) / 100;
      setActiveModel({
        ...activeModel,
        telemetry: {
          ...activeModel.telemetry,
          filament_mass_grams: mass,
          estimated_cost_usd: cost
        }
      });
    }
  };

  // Handle Code Recompile from Code Modal
  const handleRecompileCode = async (newCode) => {
    if (!activeModel) return;

    setIsRecompiling(true);
    try {
      const result = await recompileModel(
        activeModel.model_id,
        newCode,
        {},
        infillPercent
      );
      result.localTimestamp = Date.now();
      setActiveModel(result);
      setIsCodeModalOpen(false);

      if (activeSessionId) {
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, activeModel: result } : s));
      }
    } catch (err) {
      showError(`Failed to compile script: ${err.message}`);
    } finally {
      setIsRecompiling(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white text-gray-900 font-sans">
      {/* Top Main Navigation Header */}
      <Header
        activeModel={activeModel}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenCode={() => setIsCodeModalOpen(true)}
        isPreviewMinimized={isPreviewMinimized}
        onRestorePreview={() => setIsPreviewMinimized(false)}
      />

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Collapsible GPT Sidebar */}
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          backendStatus={backendStatus}
          isSidebarOpen={isSidebarOpen}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Center-Left: GPT Conversational Thread */}
        <main 
          className={`h-full flex flex-col border-r border-gray-200 bg-white relative transition-all ${
            isPreviewMinimized ? 'w-full' : 'w-full md:w-[42%] lg:w-[40%] xl:w-[38%]'
          }`}
        >


          {/* Messages Feed */}
          <ChatFeed
            messages={messages}
            isLoading={isLoading}
            currentSteps={currentSteps}
            onSelectModel={(model) => setActiveModel(model)}
            onOpenCode={() => setIsCodeModalOpen(true)}
          />

          {/* Prompt Composer */}
          <PromptInput
            onSend={handleSendPrompt}
            isLoading={isLoading}
            hasActiveModel={Boolean(activeModel)}
            activeModelTitle={activeModel?.title}
            onNewSession={handleNewSession}
          />
        </main>

        {/* Center-Right: 3D CAD Viewport with Parameters & Infill */}
        <section 
          className={`flex-1 h-full relative overflow-hidden bg-gray-50 min-w-0 ${
            isPreviewMinimized ? '!hidden' : 'hidden md:block'
          }`}
        >
            {/* Minimize Toggle Button */}
            <button
              onClick={() => setIsPreviewMinimized(true)}
              className="absolute top-4 right-4 z-30 p-2 rounded-lg bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 border border-gray-200 shadow-sm transition-all"
              title="Minimize Preview"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          {/* 3D WebGL Canvas */}
          <CADViewport
            stlUrl={activeModel ? `/api/cad/stl/${activeModel.model_id}?t=${activeModel.localTimestamp || ''}` : null}
            modelId={activeModel?.model_id}
            telemetry={activeModel?.telemetry}
            isGenerating={isLoading}
          />

          {/* Parameters & Infill Panel */}
          {activeModel && !isLoading && !isRecompiling && (
            <div className="absolute top-14 left-4 z-20 w-80 max-w-[calc(100%-32px)] pointer-events-none">
              {!isParametersOpen ? (
                <button
                  onClick={() => setIsParametersOpen(true)}
                  className="bg-white/90 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-gray-900 shadow-sm border border-gray-200 hover:border-blue-300 transition-all pointer-events-auto group backdrop-blur-sm"
                >
                  <Sliders className="w-3.5 h-3.5 text-blue-500 group-hover:rotate-45 transition-transform" />
                  <span>Parameters ({activeModel.parameters?.length || 0})</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-blue-600 font-mono text-[11px]">{infillPercent}% Infill</span>
                  <ChevronDown className="w-3 h-3 text-gray-400 ml-1" />
                </button>
              ) : (
                <div className="pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  <ParameterSliders
                    parameters={activeModel.parameters}
                    onUpdateParameters={handleUpdateParameters}
                    isRecompiling={isRecompiling}
                    infillPercent={infillPercent}
                    onInfillChange={handleInfillChange}
                    telemetry={activeModel.telemetry}
                    onClose={() => setIsParametersOpen(false)}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* OpenSCAD Procedural Code Inspector Modal */}
      <CodeViewer
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        scadCode={activeModel?.scad_code}
        onRecompileCode={handleRecompileCode}
        isRecompiling={isRecompiling}
      />

      {/* AI Key & Provider Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveKeys={handleSaveKeys}
        backendStatus={backendStatus}
      />

      {/* Floating In-App Error Notification Toast */}
      {toastError && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-md">
          <div className="p-1 rounded-lg bg-red-100 text-red-500 shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-semibold text-gray-900">Compilation Notice</p>
            <p className="text-red-700 text-[11px] mt-0.5 leading-relaxed">{toastError}</p>
          </div>
          <button
            onClick={() => setToastError(null)}
            className="p-1 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-100 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
