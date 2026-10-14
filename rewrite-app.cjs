const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `        ) : (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden p-2 gap-2 bg-[#030A07]/70 backdrop-blur-xs"
          >`;

const replacementStr = `        ) : (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative z-10 w-full h-full flex flex-col lg:flex-row overflow-hidden p-2 gap-2 bg-[#030A07] flex-1"
          >`;

let newContent = content.replace(targetStr, replacementStr);

const sidebarStart = `            {/* Left / Secondary Control Sidebar */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
              className="w-full md:w-80 lg:w-96 flex flex-col shrink-0 h-[40vh] md:h-full gap-2"
            >`;

const newSidebarStart = `            {/* Left Parameter Panel (Scrollable) */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
              className="w-full lg:w-[380px] xl:w-[400px] flex flex-col shrink-0 h-[45vh] lg:h-full gap-2 bg-[#07130F] rounded-lg border border-[rgba(16,185,129,0.15)] overflow-hidden shadow-lg"
            >`;

newContent = newContent.replace(sidebarStart, newSidebarStart);

// Remove the inline styles and fix scrollbars inside the activeSidebarTab div
const activePanelDiv = `<div className="flex-1 overflow-hidden">`;
const newActivePanelDiv = `<div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#102B21 transparent' }}>`;
newContent = newContent.replace(activePanelDiv, newActivePanelDiv);

// Right Main CAD Workspace
const rightMainStart = `          {/* Right Main CAD Workspace & Interactive 3D Canvas */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
            className="flex-1 flex flex-col h-full gap-2 overflow-hidden"
          >`;

const newRightMainStart = `          {/* Center Main CAD Workspace & AI Interpreter */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
            className="flex-1 flex flex-col min-w-0 h-full gap-2 overflow-hidden"
          >`;

newContent = newContent.replace(rightMainStart, newRightMainStart);

fs.writeFileSync('src/App.tsx', newContent);
console.log('App.tsx layout refactored.');
