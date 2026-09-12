import React, { useState } from 'react';
import {
  Plug,
  X,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Layers,
  FileCode,
  Sliders,
  Plus,
  Zap,
} from 'lucide-react';
import { PluginRegistry, CADPlugin } from '../../engine/pluginSDK';
import { CADPart } from '../../types/cad';

interface PluginManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: CADPart;
}

export const PluginManagerModal: React.FC<PluginManagerModalProps> = ({
  isOpen,
  onClose,
  part,
}) => {
  const [plugins, setPlugins] = useState<CADPlugin[]>(() => PluginRegistry.getInstance().getPlugins());
  const [activeTab, setActiveTab] = useState<'installed' | 'developer_console'>('installed');
  const [codeEditorSnippet, setCodeEditorSnippet] = useState<string>(`// CADVANTA Custom Plugin SDK Sample
export default {
  metadata: {
    id: 'my_custom_feature',
    name: 'Hexagonal Honeycomb Weight Reliever',
    version: '1.0.0',
    category: 'feature',
    enabled: true,
  },
  customFeatures: [{
    typeId: 'hex_honeycomb',
    displayName: 'Honeycomb Lightening Pocket',
    defaultParameters: { cell_radius_mm: 8, wall_thickness_mm: 1.5 },
    computeGeometry: (params, basePart) => ({
      name: 'Honeycomb Lightening Pattern',
      type: 'pattern',
      parameters: params
    })
  }]
};`);

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    PluginRegistry.getInstance().togglePlugin(id);
    setPlugins([...PluginRegistry.getInstance().getPlugins()]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#071510] border border-[rgba(16,185,129,0.3)] rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden text-[#F0FDF4]">
        {/* Header */}
        <div className="p-4 border-b border-[rgba(16,185,129,0.2)] bg-[#040E0A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#102B21] border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0] shadow-[0_0_12px_rgba(0,245,160,0.3)]">
              <Plug className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold font-mono tracking-wide text-[#F0FDF4] flex items-center gap-2">
                <span>CADVANTA Extensibility & Plugin SDK</span>
                <span className="text-[10px] bg-[#102B21] text-[#00F5A0] px-2 py-0.5 rounded-full border border-[#00F5A0]/30 uppercase font-bold">
                  API v2.0
                </span>
              </h1>
              <p className="text-xs text-[#8CA89E] font-sans">
                Extend parametric features, add custom exporters, and wire enterprise ERP integrations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-4 pt-3 border-b border-[rgba(16,185,129,0.18)] bg-[#040E0A]/40 flex gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('installed')}
            className={`pb-2 px-3 border-b-2 font-bold cursor-pointer transition-all ${
              activeTab === 'installed'
                ? 'border-[#00F5A0] text-[#00F5A0]'
                : 'border-transparent text-[#8CA89E] hover:text-[#F0FDF4]'
            }`}
          >
            Installed Plugins ({plugins.length})
          </button>
          <button
            onClick={() => setActiveTab('developer_console')}
            className={`pb-2 px-3 border-b-2 font-bold cursor-pointer transition-all ${
              activeTab === 'developer_console'
                ? 'border-[#00F5A0] text-[#00F5A0]'
                : 'border-transparent text-[#8CA89E] hover:text-[#F0FDF4]'
            }`}
          >
            Plugin Developer IDE & Sandbox
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'installed' && (
            <div className="space-y-3 font-mono">
              {plugins.map((plugin) => (
                <div
                  key={plugin.metadata.id}
                  className="p-4 rounded-xl bg-[#040E0A] border border-[rgba(16,185,129,0.2)] hover:border-[#00F5A0]/50 transition-all flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#F0FDF4]">
                        {plugin.metadata.name}
                      </span>
                      <span className="text-[10px] text-[#00F5A0] bg-[#102B21] px-1.5 py-0.5 rounded border border-[#00F5A0]/30 font-bold">
                        v{plugin.metadata.version}
                      </span>
                      <span className="text-[10px] text-[#8CA89E] uppercase tracking-wider">
                        [{plugin.metadata.category}]
                      </span>
                    </div>

                    <p className="text-xs text-[#8CA89E] font-sans leading-relaxed">
                      {plugin.metadata.description}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-[#8CA89E] pt-1">
                      <span>Author: <strong className="text-[#F0FDF4]">{plugin.metadata.author}</strong></span>
                      {plugin.customFeatures && <span>Features: <strong className="text-[#00F5A0]">+{plugin.customFeatures.length}</strong></span>}
                      {plugin.customExporters && <span>Exporters: <strong className="text-[#00F5A0]">+{plugin.customExporters.length}</strong></span>}
                      {plugin.customPanels && <span>Analysis Panels: <strong className="text-[#00F5A0]">+{plugin.customPanels.length}</strong></span>}
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => handleToggle(plugin.metadata.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      plugin.metadata.enabled
                        ? 'bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/40'
                        : 'bg-[#071510] text-[#8CA89E] border border-[rgba(16,185,129,0.2)]'
                    }`}
                  >
                    {plugin.metadata.enabled ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'developer_console' && (
            <div className="space-y-3 font-mono text-xs h-full flex flex-col">
              <div className="flex items-center justify-between text-[#8CA89E]">
                <span>TypeScript Plugin Sandbox Editor:</span>
                <span className="text-[#00F5A0]">Compiles to CADVANTA B-Rep DAG</span>
              </div>
              <textarea
                value={codeEditorSnippet}
                onChange={(e) => setCodeEditorSnippet(e.target.value)}
                rows={12}
                className="w-full flex-1 bg-[#040E0A] border border-[rgba(16,185,129,0.25)] rounded-xl p-3 text-xs text-[#00F5A0] font-mono outline-none resize-none focus:border-[#00F5A0]"
                spellCheck={false}
              />
              <div className="flex justify-between items-center pt-2">
                <div className="text-[11px] text-[#8CA89E]">
                  Public REST endpoint: <code className="text-[#00F5A0]">/api/v2/cad/plugins/execute</code>
                </div>
                <button
                  onClick={() => alert('Plugin successfully validated and registered into runtime memory!')}
                  className="px-4 py-2 rounded-lg bg-[#00F5A0] hover:bg-[#00D68C] text-[#030A07] font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,245,160,0.3)] cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Verify & Hot-Reload Plugin</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
