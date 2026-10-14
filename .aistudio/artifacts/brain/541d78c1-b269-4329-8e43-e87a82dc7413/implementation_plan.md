# VIRA AI SolidWorks API Integration: Live Desktop Bridge & Dual-Language Macro Console

Integrate official **SolidWorks API** capabilities directly into **VIRA AI**, providing a dedicated SolidWorks console tab in the VIRA assistant, dual VBA Macro (`.swp`/`.vba`) and C# .NET code generation, and a live local desktop bridge connector that allows bidirectional synchronization with a running SolidWorks session.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural direction addresses your specific answers:
> - **Primary Capability**: Live connection to a local SolidWorks desktop bridge (with status monitoring, model dispatch, and telemetry).
> - **Programming Languages**: Dual-language support generating both **SolidWorks VBA Macros** and **C# .NET API code** from the active 3D CAD model and feature tree.
> - **Access Point**: Dedicated **SolidWorks API** tab and interactive code console inside the VIRA AI modal, complemented by AI chat command integration.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **SolidWorks API Console Tab**: Adds a 4th top tab in the VIRA modal (`SolidWorks API`) alongside Copilot, DFM, and Standards.
  2. **Live Desktop Bridge Connector**: Connects VIRA to a running SolidWorks desktop instance via local endpoint (`http://127.0.0.1:4848`), displaying live connection status (Connected / Standby / Simulated Bridge), active document detection, and direct "Send Model to SolidWorks" execution.
  3. **Dual-Language Code Generator**: Converts any active Cadvanta 3D model, parameters, sketches, and feature tree into production-grade:
     - **SolidWorks VBA Macro (`.swp`/`.vba`)**: Native macro script runnable in SolidWorks via *Tools > Macro > Run*.
     - **C# .NET Standalone Code (`.cs`)**: C# console / add-in code utilizing `SolidWorks.Interop.sldworks` and `SolidWorks.Interop.swconst`.
  4. **Chat Intelligence**: Allows asking VIRA in conversational chat (e.g., *"Generate SolidWorks macro for this shaft"*, *"Export C# SolidWorks script"*, or *"Send to SolidWorks"*), returning formatted code blocks with one-click copy, download, and bridge dispatch.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Opening SolidWorks API Console**:
   - The user opens VIRA AI (via floating button, header ribbon, or shortcut `Ctrl + /`).
   - The user clicks the new **"SolidWorks API"** tab.
   - The user sees:
     - **Bridge Status Banner**: Real-time status indicator (`🟢 SolidWorks Bridge Active: Port 4848` or `🟡 Local Bridge Standby`).
     - **Target SolidWorks Version & Units**: Dropdown selector (SolidWorks 2020–2026, mm-kg-s / IPS).
     - **Dual Language Toggle**: `[VBA Macro (.vba)]` | `[C# .NET (.cs)]`.
     - **Code Preview & Action HUD**: Syntax-highlighted code editor with copy, download file (`.vba` / `.cs`), and "Execute on SolidWorks" action buttons.
     - **Local Bridge Setup Helper**: One-click download of the Python/PowerShell COM bridge script (`cadvanta_solidworks_bridge.py`) for connecting directly to `SldWorks.Application`.

2. **Generating Code from Active CAD Model**:
   - The user can select any preset (Planetary Gearbox, Stepped Shaft, Flange Coupling, Custom Sketch Extrusion) or custom model.
   - VIRA immediately inspects the active geometry, features, datum planes, and dimensions, generating exact SolidWorks API method calls:
     - Document initialization (`swApp.NewDocument(...)`)
     - Plane selection (`SelectByID2("Top Plane", "PLANE", ...)`)
     - 2D sketch entity generation (`CreateLine`, `CreateCircleByRadius`, `CreateCornerRectangle`)
     - 3D feature creation (`FeatureExtrusion3`, `FeatureRevolve2`, `FeatureFillet3`, `FeatureCut4`)
     - Material assignment (`SetMaterialPropertyName2`)
     - Mass properties query (`CreateMassProperty`)

3. **Conversational Automation via VIRA Chat**:
   - In the Copilot chat, the user types: *"Generate SolidWorks VBA code for this part"* or *"Send active model to SolidWorks"*.
   - VIRA acknowledges the command, details the SolidWorks API calls used, provides the script, and offers a button to jump straight into the SolidWorks API console.

---

## 3. Technical Architecture & File Changes

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VIRA AI Assistant Modal                         │
├────────────────────────────────────────────────────────────────────────┤
│  [CAD Engineering Copilot]  [DFM & Validation]  [Standards]  [SolidWorks API] │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      SolidWorks API Engine                             │
│                                                                        │
│  1. `solidworksApiGenerator.ts`:                                       │
│     • `generateSolidWorksVBA(part: CADPart): string`                   │
│     • `generateSolidWorksCSharp(part: CADPart): string`                │
│     • Feature translation: Extrude, Revolve, Fillet, Hole, Materials   │
│                                                                        │
│  2. `solidworksBridgeService.ts`:                                      │
│     • Health check on `http://127.0.0.1:4848/api/status`               │
│     • Dispatch CADPart JSON payload to SolidWorks COM automation       │
│     • Generate downloadable `cadvanta_solidworks_bridge.py` script     │
│                                                                        │
│  3. `SolidWorksApiConsole.tsx`:                                        │
│     • Interactive UI tab with language switch (VBA / C#)               │
│     • Live code editor, Copy, Download, and "Dispatch to Bridge"       │
│                                                                        │
│  4. `viraCadAgent.ts`:                                                 │
│     • Intent matching for "solidworks", "vba macro", "sw api", "c#"    │
└────────────────────────────────────────────────────────────────────────┘
```

### Component & File Changes

1. **`src/engine/solidworksApiGenerator.ts`** *(New)*:
   - Contains pure parametric translation functions:
     - `generateSolidWorksVBA(part: CADPart, options?: SolidWorksExportOptions): string`
     - `generateSolidWorksCSharp(part: CADPart, options?: SolidWorksExportOptions): string`
     - Supports all CAD part types (shaft, gearbox, plate, flange, sketch extrusion, cylinder, gears).
     - Generates valid, error-handled SolidWorks API code with comments, constants (`swEndCondBlind`, `swCommandInProgress`), and clean indentation.

2. **`src/engine/solidworksBridgeService.ts`** *(New)*:
   - Manages connection lifecycle with local desktop SolidWorks bridge (`http://127.0.0.1:4848`).
   - Provides methods:
     - `checkBridgeConnection()`: tests health of local agent.
     - `sendModelToBridge(part: CADPart)`: posts geometry instructions to local COM bridge.
     - `getPythonBridgeScript()`: generates standalone helper script that runs on user's PC using `win32com.client.Dispatch("SldWorks.Application")`.

3. **`src/components/ViraBot/SolidWorksApiConsole.tsx`** *(New)*:
   - Premium engineering UI tab:
     - Connection status banner with ping indicator and port toggle.
     - Dual-language toggle (VBA vs C#).
     - Code console with syntax highlighting, line counter, copy button, and `.vba`/`.cs` file export.
     - Interactive test execution button with live feedback log.

4. **`src/components/ViraBot/ViraBotModal.tsx`**:
   - Add the 4th tab: `solidworks` with SolidWorks branding icon.
   - Mount `<SolidWorksApiConsole />` inside the tab view.
   - Add SolidWorks quick action pills in the chat header.

5. **`src/engine/viraCadAgent.ts`**:
   - Add intent detection for queries containing "solidworks", "sw api", "vba", "macro", "c#", "sldprt".
   - Return rich `ViraAgentResponse` containing SolidWorks API preview and suggested action to open the SolidWorks console.

---

## 4. Verification Plan

1. **Lint & Build**: Run `lint_applet` and `compile_applet` to ensure clean TypeScript compilation with zero errors.
2. **Code Generation Verification**:
   - Test VBA macro generation for Stepped Shaft, Planetary Gearbox, and custom 2D Sketch Extrusion.
   - Test C# .NET code generation with valid `using SolidWorks.Interop.sldworks` namespaces.
3. **Bridge & UI Interaction**:
   - Verify tab navigation in VIRA AI modal.
   - Verify language toggle, file download (`.vba` and `.cs`), and clipboard copy.
   - Test bridge connection simulation and test dispatch log.
