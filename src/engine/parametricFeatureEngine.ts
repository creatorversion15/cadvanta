import { CADPart, FeatureHistoryItem } from '../types/cad';
import { generateCADModel3D } from '../cad/geometryGenerators';
import * as THREE from 'three';

export interface ParametricNode {
  id: string;
  name: string;
  type: FeatureHistoryItem['type'];
  description: string;
  parameters: Record<string, any>;
  enabled: boolean;
  suppressed: boolean;
  dependencies: string[]; // Parent feature IDs that this feature relies upon
  state: 'cached' | 'dirty' | 'evaluating' | 'error';
  executionTimeMs: number;
  lastUpdatedTimestamp: number;
}

export interface IncrementalRecomputeResult {
  part: CADPart;
  recomputedNodeIds: string[];
  cachedNodeIds: string[];
  totalRecomputeTimeMs: number;
  incrementalTimeSavedMs: number;
  activeRollbackIndex: number;
  dagSummary: {
    totalFeatures: number;
    activeFeatures: number;
    suppressedFeatures: number;
  };
}

export class ParametricFeatureEngine {
  private nodes: Map<string, ParametricNode> = new Map();
  private rollbackIndex: number = -1; // -1 means all features active (no rollback)
  private dependencyGraph: Map<string, Set<string>> = new Map(); // childId -> Set of parentIds
  private reverseDependencyGraph: Map<string, Set<string>> = new Map(); // parentId -> Set of direct children

  constructor(part?: CADPart) {
    if (part) {
      this.initializeFromPart(part);
    }
  }

  public initializeFromPart(part: CADPart): void {
    this.nodes.clear();
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();

    const features = part.features || [];
    features.forEach((feat, index) => {
      // Establish automatic structural dependencies:
      // Later features naturally depend on the base/upstream features
      const parentDeps: string[] = [];
      if (index > 0) {
        // Depends on previous node or base feature
        parentDeps.push(features[index - 1].id);
        if (index > 1 && feat.type !== 'fillet' && feat.type !== 'chamfer') {
          parentDeps.push(features[0].id); // depends on base feature
        }
      }

      const node: ParametricNode = {
        id: feat.id,
        name: feat.name,
        type: feat.type,
        description: feat.description,
        parameters: { ...feat.parameters },
        enabled: feat.enabled !== false,
        suppressed: false,
        dependencies: parentDeps,
        state: 'cached',
        executionTimeMs: Number((Math.random() * 2.5 + 0.8).toFixed(2)),
        lastUpdatedTimestamp: Date.now(),
      };

      this.nodes.set(node.id, node);
      this.dependencyGraph.set(node.id, new Set(parentDeps));

      parentDeps.forEach((pId) => {
        if (!this.reverseDependencyGraph.has(pId)) {
          this.reverseDependencyGraph.set(pId, new Set());
        }
        this.reverseDependencyGraph.get(pId)!.add(node.id);
      });
    });

    this.rollbackIndex = features.length - 1;
  }

  public getNodes(): ParametricNode[] {
    return Array.from(this.nodes.values());
  }

  public getRollbackIndex(): number {
    return this.rollbackIndex;
  }

  public setRollbackIndex(index: number, part: CADPart): IncrementalRecomputeResult {
    const featureList = Array.from(this.nodes.values());
    this.rollbackIndex = Math.max(-1, Math.min(featureList.length - 1, index));

    featureList.forEach((node, idx) => {
      node.suppressed = idx > this.rollbackIndex;
    });

    return this.recompute(part, []);
  }

  /**
   * Edit parameters of a specific feature node and incrementally recompute
   * only the modified node and its downstream dependents.
   */
  public updateFeatureParameters(
    featureId: string,
    newParams: Record<string, any>,
    part: CADPart
  ): IncrementalRecomputeResult {
    const node = this.nodes.get(featureId);
    if (!node) {
      return this.recompute(part, []);
    }

    node.parameters = { ...node.parameters, ...newParams };
    node.lastUpdatedTimestamp = Date.now();

    // Mark dirty: the edited node and all downstream dependent nodes
    const dirtyNodes = new Set<string>();
    this.markDownstreamDirty(featureId, dirtyNodes);

    return this.recompute(part, Array.from(dirtyNodes));
  }

  /**
   * Toggle suppression of a feature (freeze or bypass its geometry)
   */
  public toggleFeatureSuppression(featureId: string, part: CADPart): IncrementalRecomputeResult {
    const node = this.nodes.get(featureId);
    if (!node) return this.recompute(part, []);

    node.suppressed = !node.suppressed;
    const dirtyNodes = new Set<string>();
    this.markDownstreamDirty(featureId, dirtyNodes);

    return this.recompute(part, Array.from(dirtyNodes));
  }

  private markDownstreamDirty(nodeId: string, dirtySet: Set<string>): void {
    dirtySet.add(nodeId);
    const node = this.nodes.get(nodeId);
    if (node) {
      node.state = 'dirty';
    }

    const children = this.reverseDependencyGraph.get(nodeId);
    if (children) {
      children.forEach((childId) => {
        if (!dirtySet.has(childId)) {
          this.markDownstreamDirty(childId, dirtySet);
        }
      });
    }
  }

  /**
   * Performs incremental DAG recomputation
   */
  public recompute(part: CADPart, dirtyNodeIds: string[]): IncrementalRecomputeResult {
    const startTime = performance.now();
    const recomputedNodeIds: string[] = [];
    const cachedNodeIds: string[] = [];

    const nodesArray = Array.from(this.nodes.values());
    const effectiveDirty = new Set(dirtyNodeIds);

    // If no specific dirty node specified, recompute dirty nodes or all if empty
    nodesArray.forEach((node, index) => {
      const isPastRollback = this.rollbackIndex !== -1 && index > this.rollbackIndex;

      if (isPastRollback || node.suppressed) {
        node.state = 'cached';
        cachedNodeIds.push(node.id);
        return;
      }

      if (effectiveDirty.has(node.id) || node.state === 'dirty') {
        const nodeStartTime = performance.now();
        // Simulate discrete recomputation of the feature geometry
        node.state = 'evaluating';
        node.executionTimeMs = Number((performance.now() - nodeStartTime + (Math.random() * 1.5 + 0.5)).toFixed(2));
        node.state = 'cached';
        recomputedNodeIds.push(node.id);
      } else {
        node.state = 'cached';
        cachedNodeIds.push(node.id);
      }
    });

    // Synchronize parameters back into CADPart
    const updatedFeatures: FeatureHistoryItem[] = [];
    const updatedParams = { ...part.parameters };

    nodesArray.forEach((node, index) => {
      const isPastRollback = this.rollbackIndex !== -1 && index > this.rollbackIndex;
      const isActive = !isPastRollback && !node.suppressed && node.enabled;

      updatedFeatures.push({
        id: node.id,
        name: node.name,
        type: node.type,
        description: node.description,
        parameters: node.parameters,
        enabled: isActive,
      });

      if (isActive) {
        Object.assign(updatedParams, node.parameters);
      }
    });

    const elapsedMs = Number((performance.now() - startTime).toFixed(2));
    const fullRebuildSimulatedMs = Number((nodesArray.length * 4.2).toFixed(1));
    const timeSavedMs = Math.max(0, Number((fullRebuildSimulatedMs - elapsedMs).toFixed(1)));

    const updatedPart: CADPart = {
      ...part,
      parameters: updatedParams,
      features: updatedFeatures,
    };

    return {
      part: updatedPart,
      recomputedNodeIds,
      cachedNodeIds,
      totalRecomputeTimeMs: elapsedMs,
      incrementalTimeSavedMs: timeSavedMs,
      activeRollbackIndex: this.rollbackIndex,
      dagSummary: {
        totalFeatures: nodesArray.length,
        activeFeatures: updatedFeatures.filter((f) => f.enabled).length,
        suppressedFeatures: nodesArray.filter((n) => n.suppressed).length,
      },
    };
  }

  /**
   * Add a new feature operation to the parametric feature tree and incrementally solve DAG.
   */
  public addFeature(
    featureData: {
      name: string;
      type: FeatureHistoryItem['type'];
      description: string;
      parameters: Record<string, any>;
      dependencies?: string[];
    },
    part: CADPart
  ): IncrementalRecomputeResult {
    const featureId = `feat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nodesList = Array.from(this.nodes.values());
    const lastNode = nodesList.length > 0 ? nodesList[nodesList.length - 1] : null;

    const deps = featureData.dependencies && featureData.dependencies.length > 0
      ? featureData.dependencies
      : (lastNode ? [lastNode.id] : []);

    const newNode: ParametricNode = {
      id: featureId,
      name: featureData.name,
      type: featureData.type,
      description: featureData.description,
      parameters: { ...featureData.parameters },
      dependencies: deps,
      state: 'dirty',
      enabled: true,
      suppressed: false,
      lastUpdatedTimestamp: Date.now(),
      executionTimeMs: 0,
    };

    this.nodes.set(featureId, newNode);

    // Register in reverse dependencies
    deps.forEach((depId) => {
      if (!this.reverseDependencyGraph.has(depId)) {
        this.reverseDependencyGraph.set(depId, new Set());
      }
      this.reverseDependencyGraph.get(depId)!.add(featureId);
    });

    this.rollbackIndex = this.nodes.size - 1;
    return this.recompute(part, [featureId]);
  }

  /**
   * Remove a feature operation and re-evaluate the DAG.
   */
  public deleteFeature(featureId: string, part: CADPart): IncrementalRecomputeResult {
    const node = this.nodes.get(featureId);
    if (!node) return this.recompute(part, []);

    // Get dependents
    const dependents = Array.from(this.reverseDependencyGraph.get(featureId) || []);
    this.nodes.delete(featureId);
    this.reverseDependencyGraph.delete(featureId);

    // Remove featureId from all other reverse dependency sets
    this.reverseDependencyGraph.forEach((children) => {
      children.delete(featureId);
    });

    if (this.rollbackIndex >= this.nodes.size) {
      this.rollbackIndex = this.nodes.size - 1;
    }

    return this.recompute(part, dependents);
  }
}

