import React from 'react';
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  PanelRightOpen,
  Download, 
  Code, 
  Box
} from 'lucide-react';
import { getDownloadUrl } from '../../services/api';

export default function Header({ 
  activeModel, 
  isSidebarOpen, 
  onToggleSidebar,
  onOpenCode,
  isPreviewMinimized,
  onRestorePreview
}) {
  return (
    <header className="h-14 px-4 bg-white border-b border-gray-200 flex items-center justify-between select-none z-20">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          title="Toggle Sidebar"
        >
          {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2 text-gray-800 font-semibold">
          <Box className="w-5 h-5 text-gray-800" />
          <span>PromptCAD</span>
        </div>
      </div>

      {/* Right section: Slicer Export & Code */}
      <div className="flex items-center gap-2">
        {isPreviewMinimized && (
          <button
            onClick={onRestorePreview}
            className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <PanelRightOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Show 3D Preview</span>
          </button>
        )}
        {activeModel && (
          <>
            <button
              onClick={() => onOpenCode(activeModel.scad_code)}
              className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">OpenSCAD Code</span>
            </button>

            <a
              href={getDownloadUrl(activeModel.model_id)}
              download={`model_${activeModel.model_id}.stl`}
              className="px-3.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export STL</span>
            </a>
          </>
        )}
      </div>
    </header>
  );
}
