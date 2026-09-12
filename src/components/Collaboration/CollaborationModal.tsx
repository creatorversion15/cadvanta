import React, { useState, useEffect } from 'react';
import { CADPart } from '../../types/cad';
import {
  PermissionLevel,
  VersionSnapshot,
  CADAnnotation,
  getSavedVersions,
  saveVersionSnapshot,
  generateShareableLink,
  getStoredAnnotations,
  saveAnnotation,
  toggleResolveAnnotation,
} from '../../engine/collaborationManager';
import {
  X,
  Share2,
  History,
  MessageSquare,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Lock,
  Eye,
  Edit3,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPart: CADPart;
  onRestoreVersion?: (part: CADPart) => void;
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  onClose,
  currentPart,
  onRestoreVersion,
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'history' | 'comments'>('share');
  const [permission, setPermission] = useState<PermissionLevel>('view');
  const [copied, setCopied] = useState<boolean>(false);

  // Version history state
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [commitMessage, setCommitMessage] = useState<string>('');

  // Annotations state
  const [annotations, setAnnotations] = useState<CADAnnotation[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [filterResolved, setFilterResolved] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setVersions(getSavedVersions());
      setAnnotations(getStoredAnnotations());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const { shareUrl } = generateShareableLink(currentPart, permission);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCreateSnapshot = () => {
    if (!commitMessage.trim()) return;
    const newVer = saveVersionSnapshot(currentPart, commitMessage.trim(), 'Viraj Bansod');
    setVersions([newVer, ...versions]);
    setCommitMessage('');
  };

  const handleRestore = (ver: VersionSnapshot) => {
    if (onRestoreVersion) {
      onRestoreVersion(ver.part);
    }
    onClose();
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newAnn: CADAnnotation = {
      id: `ann_${Date.now()}`,
      author: 'Viraj Bansod',
      timestamp: 'Just now',
      position: [0, 0, 0],
      text: newCommentText.trim(),
      resolved: false,
    };
    const updated = saveAnnotation(newAnn);
    setAnnotations(updated);
    setNewCommentText('');
  };

  const handleToggleResolve = (id: string) => {
    const updated = toggleResolveAnnotation(id);
    setAnnotations(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#020A07]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-gradient-to-b from-[#0A1D16] to-[#05110D] border border-[#00F5A0]/35 rounded-2xl shadow-[0_0_60px_rgba(0,245,160,0.18)] flex flex-col text-[#F0FDF4] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(16,185,129,0.2)] bg-[#071510]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102B21] border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.25)]">
              <Share2 className="w-5 h-5 text-[#00F5A0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F5A0] font-bold">
                  TEAM COLLABORATION & VERSION CONTROL
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#00F5A0]/20 text-[#00F5A0] text-[9px] font-mono border border-[#00F5A0]/30 font-bold">
                  MULTI-SEAT CAD
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold font-mono text-[#F0FDF4] tracking-tight">
                Project Sharing, Version History & 3D Annotations
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-[#071510] border-b border-[rgba(16,185,129,0.15)] flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'share'
                ? 'bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/40'
                : 'text-[#8CA89E] hover:text-[#F0FDF4]'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Shareable Project Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/40'
                : 'text-[#8CA89E] hover:text-[#F0FDF4]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Version History ({versions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'comments'
                ? 'bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/40'
                : 'text-[#8CA89E] hover:text-[#F0FDF4]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>3D Review Annotations ({annotations.length})</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* TAB 1: Share Link */}
          {activeTab === 'share' && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-[#00F5A0] block">
                  1. Choose Permission Access Level
                </span>

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'view', label: 'View (Read-Only)', icon: Eye, desc: 'Can rotate, inspect, measure, and section the 3D model.' },
                    { id: 'comment', label: 'Reviewer (Comment)', icon: MessageSquare, desc: 'Can place 3D comments, annotations, and DFM reviews.' },
                    { id: 'edit', label: 'Co-Designer (Edit)', icon: Edit3, desc: 'Can modify parameters, add features, and run FEA.' },
                  ].map((lvl) => {
                    const Icon = lvl.icon;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setPermission(lvl.id as PermissionLevel)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          permission === lvl.id
                            ? 'bg-[#102B21] border-[#00F5A0] text-[#00F5A0]'
                            : 'bg-[#0B1E17] border-[rgba(16,185,129,0.2)] text-[#8CA89E] hover:text-[#F0FDF4]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-mono font-bold text-xs mb-1">
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{lvl.label}</span>
                        </div>
                        <p className="text-[11px] text-[#8CA89E] font-sans leading-relaxed">{lvl.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generated Link Input */}
              <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-[#00F5A0] block">
                    2. Shareable Project URL
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/30 font-bold">
                    {permission === 'view' ? 'VIEW-ONLY ACCESS' : permission === 'comment' ? 'REVIEWER ACCESS' : 'FULL EDIT ACCESS'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 h-11 px-3 bg-[#030A07] rounded-xl border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4] select-all truncate"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex-1 sm:flex-initial px-5 h-11 rounded-xl bg-[#00F5A0] hover:bg-[#34EEA9] text-[#030A07] font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-[0_0_15px_rgba(0,245,160,0.25)]"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied to Clipboard!' : 'Copy Link'}</span>
                    </button>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 h-11 rounded-xl bg-[#102B21] hover:bg-[#16382B] text-[#00F5A0] border border-[#00F5A0]/30 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      title="Test opening this link in a new tab"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Test Link</span>
                    </a>
                  </div>
                </div>

                {/* View-Only Capabilities Card */}
                <div className="p-3 rounded-lg bg-[#0B1E17] border border-[rgba(16,185,129,0.18)] space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-[#00F5A0] font-mono font-bold text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-[#00F5A0] shrink-0" />
                    <span>View-Only Guarantees:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#8CA89E] font-sans">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
                      <span>Full 3D orbit, zoom, pan & sectioning</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
                      <span>Inspect material specs & mass</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
                      <span>Source model parameters are locked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
                      <span>Viewer can clone to their own copy</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Version History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Commit Snapshot Form */}
              <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-[#00F5A0] block">
                  Create New Revision Snapshot (Save Point)
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="e.g. Changed main journal to 55mm and added DIN keyway"
                    className="flex-1 h-10 px-3 bg-[#030A07] rounded-xl border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                  />
                  <button
                    type="button"
                    onClick={handleCreateSnapshot}
                    disabled={!commitMessage.trim()}
                    className="px-4 h-10 rounded-xl bg-[#00F5A0] hover:bg-[#34EEA9] text-[#030A07] font-mono text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    Save Revision
                  </button>
                </div>
              </div>

              {/* Version History List */}
              <div className="space-y-2.5">
                {versions.length === 0 ? (
                  <div className="p-8 text-center text-xs font-mono text-[#8CA89E] border border-dashed border-[rgba(16,185,129,0.2)] rounded-xl">
                    No past version snapshots saved yet. Create a revision snapshot above to track changes!
                  </div>
                ) : (
                  versions.map((ver) => (
                    <div
                      key={ver.id}
                      className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.2)] flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#102B21] text-[#00F5A0] font-mono font-bold text-xs border border-[#00F5A0]/30">
                            {ver.versionTag}
                          </span>
                          <span className="font-bold text-xs text-[#F0FDF4] font-sans">{ver.commitMessage}</span>
                        </div>
                        <div className="text-[11px] font-mono text-[#8CA89E]">
                          By {ver.author} • {ver.timestamp}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestore(ver)}
                        className="px-3 py-1.5 rounded-lg bg-[#102B21] hover:bg-[#16382B] border border-[#00F5A0]/40 text-[#00F5A0] text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore This Version</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: 3D Annotations */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* New Comment Input */}
              <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-2">
                <span className="text-xs font-mono font-bold uppercase text-[#00F5A0] block">
                  Add 3D Design Review Comment
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="e.g. Verify fillet radius meets 3mm DFM threshold for CNC milling"
                    className="flex-1 h-10 px-3 bg-[#030A07] rounded-xl border border-[rgba(16,185,129,0.3)] text-xs font-sans text-[#F0FDF4]"
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={!newCommentText.trim()}
                    className="px-4 h-10 rounded-xl bg-[#00F5A0] hover:bg-[#34EEA9] text-[#030A07] font-mono text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    Post Comment
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {annotations.map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-4 rounded-xl border transition-all ${
                      ann.resolved
                        ? 'bg-[#05110D] border-[rgba(16,185,129,0.1)] opacity-60'
                        : 'bg-[#071510] border-[rgba(16,185,129,0.25)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#00F5A0] font-mono">{ann.author}</span>
                        <span className="text-[10px] text-[#8CA89E] font-mono">{ann.timestamp}</span>
                        {ann.featureName && (
                          <span className="text-[10px] px-1.5 rounded bg-[#030A07] text-[#8CA89E] border border-[rgba(16,185,129,0.2)]">
                            {ann.featureName}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleResolve(ann.id)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          ann.resolved
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-[#102B21] text-[#8CA89E] hover:text-[#00F5A0]'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{ann.resolved ? 'Resolved' : 'Mark Resolved'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-[#F0FDF4] font-sans leading-relaxed">{ann.text}</p>

                    {ann.replies && ann.replies.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[rgba(16,185,129,0.15)] space-y-1.5 pl-3 border-l-2 border-l-[#00F5A0]">
                        {ann.replies.map((rep) => (
                          <div key={rep.id} className="text-xs">
                            <span className="font-bold text-[#00F5A0] font-mono">{rep.author}: </span>
                            <span className="text-[#8CA89E] font-sans">{rep.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
