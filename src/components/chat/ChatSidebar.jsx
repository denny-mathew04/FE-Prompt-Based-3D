import React from 'react';
import { 
  Plus, 
  History, 
  Trash2, 
  Layers
} from 'lucide-react';

export default function ChatSidebar({
  sessions = [],
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  backendStatus,
  isSidebarOpen,
  onOpenSettings
}) {
  return (
    <aside className={`h-full bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 z-30 select-none ${
      isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
    }`}>
      {/* Main Scrollable History */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <div>
          <div className="flex items-center gap-1.5 px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            <History className="w-3 h-3 text-gray-400" />
            <span>History</span>
          </div>

          {sessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-gray-500 text-xs">
              No saved generations yet.<br />Enter a prompt to create your first 3D model!
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => onSelectSession(sess.id)}
                    className={`group relative flex items-center justify-between px-2.5 py-2.5 rounded-lg text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <Layers className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="truncate">{sess.title || 'Untitled Model'}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(sess.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer / New Project */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-semibold shadow-sm hover:bg-gray-50 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New CAD Project</span>
        </button>
      </div>
    </aside>
  );
}
