import React, { useState, useEffect } from 'react';
import {
  Code,
  Copy,
  Check,
  Download,
  Send,
  RefreshCw,
  Terminal,
  ExternalLink,
  Cpu,
  Layers,
  FileCode,
  HelpCircle,
  Play,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CADPart } from '../../types/cad';
import { generateSolidWorksVBA, generateSolidWorksCSharp } from '../../engine/solidworksApiGenerator';
import {
  checkSolidWorksBridge,
  dispatchModelToSolidWorksBridge,
  getPythonBridgeHelperScript,
  SolidWorksBridgeStatus,
} from '../../engine/solidworksBridgeService';

interface SolidWorksApiConsoleProps {
  currentPart: CADPart;
}

export const SolidWorksApiConsole: React.FC<SolidWorksApiConsoleProps> = ({ currentPart }) => {
  const [selectedLang, setSelectedLang] = useState<'vba' | 'csharp'>('vba');
  const [bridgeStatus, setBridgeStatus] = useState<SolidWorksBridgeStatus | null>(null);
  const [isCheckingBridge, setIsCheckingBridge] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[*] CADVANTA VIRA SolidWorks API Engine initialized.',
    `[*] Target active model: "${currentPart.name}" (${currentPart.part_type}).`,
    '[*] Ready to generate VBA Macros and C# .NET automation code.',
  ]);
  const [showBridgeHelp, setShowBridgeHelp] = useState<boolean>(false);
  const [port, setPort] = useState<number>(4848);

  // Generate code on language or part change
  const currentCode =
    selectedLang === 'vba'
      ? generateSolidWorksVBA(currentPart)
      : generateSolidWorksCSharp(currentPart);

  // Check bridge on initial mount
  useEffect(() => {
    handlePingBridge();
  }, []);

  const handlePingBridge = async () => {
    setIsCheckingBridge(true);
    try {
      const status = await checkSolidWorksBridge(port);
      setBridgeStatus(status);
      setTerminalLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Bridge Ping (Port ${port}): ${
          status.connected ? 'ONLINE (Connected to SldWorks.Application)' : 'STANDBY (Local bridge waiting)'
        }`,
      ]);
    } catch {
      // ignore
    } finally {
      setIsCheckingBridge(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setTerminalLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Copied ${selectedLang.toUpperCase()} code to clipboard.`,
      ]);
    } catch {
      // ignore
    }
  };

  const handleDownloadCode = () => {
    const filename = `${currentPart.name.replace(/[^a-zA-Z0-9_]/g, '_')}_SolidWorks.${
      selectedLang === 'vba' ? 'vba' : 'cs'
    }`;
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTerminalLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Downloaded file: ${filename}`,
    ]);
  };

  const handleDownloadPythonBridge = () => {
    const script = getPythonBridgeHelperScript();
    const blob = new Blob([script], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cadvanta_solidworks_bridge.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTerminalLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Downloaded local bridge connector: cadvanta_solidworks_bridge.py`,
    ]);
  };

  const handleDispatchToBridge = async () => {
    setIsDispatching(true);
    setTerminalLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Dispatching "${currentPart.name}" to SolidWorks Bridge...`,
    ]);

    try {
      const result = await dispatchModelToSolidWorksBridge(currentPart, port);
      setTerminalLogs((prev) => [...prev, ...result.responseLog]);
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        `[-] Bridge Dispatch Error: ${err?.message || 'Connection timeout'}`,
      ]);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC] overflow-y-auto p-4 space-y-4 font-sans text-xs">
      {/* 1. SOLIDWORKS BRIDGE CONNECTION STATUS BANNER */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${
                bridgeStatus?.connected
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">
                  SolidWorks Desktop COM Bridge
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                    bridgeStatus?.connected
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {bridgeStatus?.connected ? 'CONNECTED (PORT 4848)' : 'STANDBY / SCRIPT MODE'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {bridgeStatus?.connected
                  ? `Active Document: ${bridgeStatus.activeDoc || 'Ready for Geometry Dispatch'}`
                  : 'Execute scripts directly inside SolidWorks or run local COM bridge agent'}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handlePingBridge}
              disabled={isCheckingBridge}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Ping Local Bridge on Port 4848"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingBridge ? 'animate-spin' : ''}`} />
              <span>Ping Bridge</span>
            </button>

            <button
              type="button"
              onClick={handleDispatchToBridge}
              disabled={isDispatching}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              title="Send Active Part to SolidWorks"
            >
              <Play className="w-3 h-3" />
              <span>{isDispatching ? 'Dispatching...' : 'Dispatch to SolidWorks'}</span>
            </button>
          </div>
        </div>

        {/* Bridge Setup Guide Toggle */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowBridgeHelp(!showBridgeHelp)}
            className="flex items-center justify-between w-full text-[11px] text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>How to connect VIRA AI directly to your running SolidWorks application</span>
            </div>
            {showBridgeHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showBridgeHelp && (
            <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-[11px] text-slate-700">
              <p className="font-semibold text-slate-900">
                Method 1: Run Generated Macro Directly in SolidWorks (No Setup Required)
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                <li>In SolidWorks, click <strong>Tools &gt; Macro &gt; New</strong> (or press Alt+F11).</li>
                <li>Copy the generated <strong>VBA Macro</strong> code below and paste it into the code editor.</li>
                <li>Press <strong>F5</strong> (or click Run). The 3D model will instantly generate in your SolidWorks viewport!</li>
              </ol>

              <div className="pt-2 border-t border-slate-200">
                <p className="font-semibold text-slate-900">
                  Method 2: One-Click Live COM Desktop Bridge
                </p>
                <p className="text-slate-600">
                  Run our 1-file Python COM bridge script on your PC. It links VIRA AI directly to your running SolidWorks session over port 4848.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadPythonBridge}
                  className="mt-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-mono font-medium flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download cadvanta_solidworks_bridge.py</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. DUAL-LANGUAGE CODE GENERATOR CONSOLE */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col flex-1 min-h-[360px]">
        {/* Console Toolbar */}
        <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Language Switcher Tabs */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedLang('vba')}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedLang === 'vba'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>VBA Macro (.vba)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedLang('csharp')}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedLang === 'csharp'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>C# .NET API (.cs)</span>
            </button>
          </div>

          {/* Model info & Code Export */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              Model: <strong className="text-slate-800">{currentPart.name}</strong>
            </span>

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="Copy code to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCode}
              className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title={`Download as .${selectedLang === 'vba' ? 'vba' : 'cs'}`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code Content Display */}
        <div className="flex-1 bg-[#0F172A] text-[#F8FAFC] p-3 overflow-auto font-mono text-[11px] leading-relaxed select-text min-h-[240px]">
          <pre className="whitespace-pre">
            {currentCode}
          </pre>
        </div>
      </div>

      {/* 3. TERMINAL EXECUTION & DISPATCH LOG */}
      <div className="bg-[#0B131E] border border-slate-800 rounded-xl p-3 shadow-xs space-y-1.5 font-mono text-[10px]">
        <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-[#00F5A0]" />
            <span className="font-bold text-slate-200 uppercase tracking-wider">
              VIRA SolidWorks API Bridge Terminal
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTerminalLogs(['[*] Terminal logs cleared.'])}
            className="hover:underline text-slate-500 hover:text-slate-300"
          >
            Clear
          </button>
        </div>
        <div className="max-h-24 overflow-y-auto space-y-0.5 text-slate-300">
          {terminalLogs.map((log, i) => (
            <div
              key={i}
              className={
                log.startsWith('[+]')
                  ? 'text-emerald-400'
                  : log.startsWith('[-]')
                  ? 'text-rose-400'
                  : log.startsWith('[!]')
                  ? 'text-amber-400'
                  : 'text-slate-300'
              }
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
