import { CADPart } from '../types/cad';

export type CloudProviderId =
  | 'supabase'
  | 'appwrite'
  | 'convex'
  | 'aws_amplify'
  | 'mongodb_atlas'
  | 'clerk'
  | 'cloudflare';

export interface CloudProviderConfig {
  id: CloudProviderId;
  name: string;
  tagline: string;
  category: 'BaaS & Database' | 'Reactive State' | 'Enterprise Cloud' | 'Identity & Auth' | 'Edge & Storage';
  color: string;
  badge: string;
  docsUrl: string;
  endpoint: string;
  apiKey: string;
  secondaryKey?: string;
  targetResource: string; // Table / Collection / Bucket / Org / Worker
  connected: boolean;
  lastSyncedAt?: string;
  latencyMs?: number;
}

export interface CloudSyncLog {
  id: string;
  providerId: CloudProviderId;
  providerName: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
  action: string;
  details: string;
  modelName: string;
  bytesTransferred?: number;
}

const STORAGE_CONFIGS_KEY = 'cadvanta_cloud_providers_v1';
const STORAGE_LOGS_KEY = 'cadvanta_cloud_sync_logs_v1';

export const DEFAULT_CLOUD_PROVIDERS: Record<CloudProviderId, CloudProviderConfig> = {
  supabase: {
    id: 'supabase',
    name: 'Supabase',
    tagline: 'PostgreSQL CAD Database, Realtime Model Channels & Storage',
    category: 'BaaS & Database',
    color: '#3ECF8E',
    badge: 'Postgres & Realtime',
    docsUrl: 'https://supabase.com/docs',
    endpoint: 'https://xyzcompany.supabase.co',
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.cadvanta_anon_pub_key',
    secondaryKey: 'public.cad_models',
    targetResource: 'cad_parts_repository',
    connected: true,
    lastSyncedAt: 'Just now',
    latencyMs: 38,
  },
  appwrite: {
    id: 'appwrite',
    name: 'Appwrite',
    tagline: 'Open-Source BaaS, 3D Mesh Buckets & Teams Permissions',
    category: 'BaaS & Database',
    color: '#FD366E',
    badge: 'Open-Source Cloud',
    docsUrl: 'https://appwrite.io/docs',
    endpoint: 'https://cloud.appwrite.io/v1',
    apiKey: 'cadvanta_appwrite_project_8819',
    secondaryKey: 'cad_bucket_3d_assets',
    targetResource: 'cadvanta_production_db',
    connected: true,
    lastSyncedAt: '5m ago',
    latencyMs: 44,
  },
  convex: {
    id: 'convex',
    name: 'Convex',
    tagline: 'Reactive TypeScript CAD State with Optimistic UI Updates',
    category: 'Reactive State',
    color: '#F43F5E',
    badge: 'Reactive Backend',
    docsUrl: 'https://docs.convex.dev',
    endpoint: 'https://cadvanta-mesh-772.convex.cloud',
    apiKey: 'prod:cadvanta-reactive-engine-token',
    targetResource: 'models:syncCADPartMutation',
    connected: true,
    lastSyncedAt: '12m ago',
    latencyMs: 22,
  },
  aws_amplify: {
    id: 'aws_amplify',
    name: 'AWS Amplify',
    tagline: 'AppSync GraphQL API, S3 CAD Blob Vault & DynamoDB Tables',
    category: 'Enterprise Cloud',
    color: '#FF9900',
    badge: 'AWS Enterprise',
    docsUrl: 'https://docs.amplify.aws',
    endpoint: 'https://amplify.us-east-1.amazonaws.com/apps/d12984k9',
    apiKey: 'da2-cadvantaamplifygraphqlkey8820',
    secondaryKey: 's3://cadvanta-step-vault-us-east-1',
    targetResource: 'CADPartModelSchema',
    connected: false,
    latencyMs: 58,
  },
  mongodb_atlas: {
    id: 'mongodb_atlas',
    name: 'MongoDB Atlas',
    tagline: 'Flexible B-Rep Tree Document Schema & Vector Similarity Search',
    category: 'BaaS & Database',
    color: '#00ED64',
    badge: 'Global Document Cloud',
    docsUrl: 'https://www.mongodb.com/docs/atlas',
    endpoint: 'mongodb+srv://cluster0.cadvanta.mongodb.net',
    apiKey: 'cad_service_user:vault_auth_token_882',
    secondaryKey: 'cadvanta_cad_engine',
    targetResource: 'parts_and_assemblies_collection',
    connected: true,
    lastSyncedAt: '18m ago',
    latencyMs: 46,
  },
  clerk: {
    id: 'clerk',
    name: 'Clerk',
    tagline: 'Engineering Team SSO, Organization Workspaces & Multi-Session',
    category: 'Identity & Auth',
    color: '#6C47FF',
    badge: 'Enterprise Identity',
    docsUrl: 'https://clerk.com/docs',
    endpoint: 'https://clerk.cadvanta.engineering',
    apiKey: 'pk_live_cadvanta_org_identity_token_9918',
    secondaryKey: 'org_cadvanta_aerospace_division',
    targetResource: 'workspace_engineers_session',
    connected: true,
    lastSyncedAt: '1m ago',
    latencyMs: 29,
  },
  cloudflare: {
    id: 'cloudflare',
    name: 'Cloudflare',
    tagline: 'Workers Edge Compute, D1 SQL Database & Zero-Egress R2 Storage',
    category: 'Edge & Storage',
    color: '#F38020',
    badge: 'Edge Cloud & R2',
    docsUrl: 'https://developers.cloudflare.com',
    endpoint: 'https://cad-edge-router.cadvanta.workers.dev',
    apiKey: 'cadvanta_cf_api_token_r2_d1_09284',
    secondaryKey: 'r2-cad-assets-vault',
    targetResource: 'D1_CADVANTA_METRICS_DB',
    connected: true,
    lastSyncedAt: 'Just now',
    latencyMs: 18,
  },
};

export function getStoredCloudProviders(): Record<CloudProviderId, CloudProviderConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_CONFIGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CLOUD_PROVIDERS, ...parsed };
    }
  } catch (err) {
    console.error('Error reading cloud provider configs:', err);
  }
  return { ...DEFAULT_CLOUD_PROVIDERS };
}

export function saveCloudProviderConfig(
  providerId: CloudProviderId,
  updates: Partial<CloudProviderConfig>
): Record<CloudProviderId, CloudProviderConfig> {
  const current = getStoredCloudProviders();
  current[providerId] = { ...current[providerId], ...updates };
  try {
    localStorage.setItem(STORAGE_CONFIGS_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Error saving cloud provider configs:', err);
  }
  return current;
}

export function getStoredCloudLogs(): CloudSyncLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading cloud sync logs:', err);
  }
  return [
    {
      id: 'log-1',
      providerId: 'cloudflare',
      providerName: 'Cloudflare R2 + D1',
      timestamp: '2 mins ago',
      status: 'success',
      action: 'Edge Object Cache Put',
      details: 'Pushed STEP & Parasolid geometries to R2 zero-egress bucket [r2-cad-assets-vault]',
      modelName: 'Primary Drive Shaft',
      bytesTransferred: 42180,
    },
    {
      id: 'log-2',
      providerId: 'supabase',
      providerName: 'Supabase',
      timestamp: '6 mins ago',
      status: 'success',
      action: 'Row-Level Security Upsert',
      details: 'Upserted 1 CAD record to public.cad_models with calculated volume and mass metrics',
      modelName: 'Primary Drive Shaft',
      bytesTransferred: 8420,
    },
    {
      id: 'log-3',
      providerId: 'convex',
      providerName: 'Convex',
      timestamp: '14 mins ago',
      status: 'success',
      action: 'Mutation models:syncCADPart',
      details: 'Reactive sync executed in 22ms. Subscribed clients notified via WebSocket',
      modelName: 'Primary Drive Shaft',
      bytesTransferred: 6110,
    },
    {
      id: 'log-4',
      providerId: 'clerk',
      providerName: 'Clerk',
      timestamp: '25 mins ago',
      status: 'success',
      action: 'Session Token Audit',
      details: 'Verified engineer token permissions for organization [Aerospace & Mechanical Dev]',
      modelName: 'User Session',
      bytesTransferred: 1240,
    },
  ];
}

export function appendCloudSyncLog(log: Omit<CloudSyncLog, 'id' | 'timestamp'>): CloudSyncLog {
  const logs = getStoredCloudLogs();
  const newLog: CloudSyncLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: 'Just now',
  };
  const updated = [newLog, ...logs.slice(0, 49)];
  try {
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving cloud sync logs:', err);
  }
  return newLog;
}

// Generate SDK code snippets for developers
export function getSDKCodeSnippet(providerId: CloudProviderId, part: CADPart, config: CloudProviderConfig): string {
  switch (providerId) {
    case 'supabase':
      return `// Supabase CAD Storage & Postgres Client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('${config.endpoint}', '${config.apiKey.substring(0, 20)}...');

export async function syncCADModelToSupabase() {
  const { data, error } = await supabase
    .from('${config.secondaryKey || 'cad_models'}')
    .upsert({
      id: '${part.id}',
      name: '${part.name}',
      part_type: '${part.part_type}',
      material_id: '${part.material?.id}',
      parameters: ${JSON.stringify(part.parameters, null, 2)},
      calculated_metrics: {
        volume_cm3: ${part.calculatedMetrics?.volume || 100},
        mass_kg: ${(part.calculatedMetrics?.volume || 100) * (part.material?.density || 7.85) / 1000}
      },
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
  console.log('Successfully synced to Supabase Postgres:', data);
}`;

    case 'appwrite':
      return `// Appwrite BaaS & CAD File Storage Bucket
import { Client, Databases, Storage, ID } from 'appwrite';

const client = new Client()
  .setEndpoint('${config.endpoint}')
  .setProject('${config.apiKey}');

const databases = new Databases(client);
const storage = new Storage(client);

export async function saveModelToAppwrite() {
  // 1. Save metadata document
  const doc = await databases.createDocument(
    '${config.targetResource}',
    'parts_collection',
    ID.unique(),
    {
      name: '${part.name}',
      partType: '${part.part_type}',
      parametersJson: JSON.stringify(${JSON.stringify(part.parameters)}),
      materialName: '${part.material?.name}',
    }
  );

  console.log('Appwrite document created:', doc.$id);
}`;

    case 'convex':
      return `// Convex Reactive CAD Backend Function
import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const syncCADPart = mutation({
  args: {
    name: v.string(),
    partType: v.string(),
    parameters: v.any(),
    materialId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('cad_parts')
      .filter((q) => q.eq(q.field('name'), args.name))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, args);
    }
    return await ctx.db.insert('cad_parts', args);
  },
});

// Client Usage:
// const sync = useMutation(api.models.syncCADPart);
// await sync({ name: '${part.name}', partType: '${part.part_type}', parameters: ... });`;

    case 'aws_amplify':
      return `// AWS Amplify GraphQL & S3 CAD Asset Vault
import { generateClient } from 'aws-amplify/api';
import { uploadData } from 'aws-amplify/storage';

const client = generateClient();

export async function syncToAWSAmplify() {
  // 1. Upload model record via GraphQL
  const newPart = await client.graphql({
    query: \`mutation CreateCADPart($input: CreateCADPartInput!) {
      createCADPart(input: $input) {
        id
        name
        partType
        updatedAt
      }
    }\`,
    variables: {
      input: {
        name: '${part.name}',
        partType: '${part.part_type}',
        parameters: JSON.stringify(${JSON.stringify(part.parameters)}),
      }
    }
  });

  // 2. Upload STEP 3D Geometry to S3
  await uploadData({
    key: 'cad-vault/${part.id}.step',
    data: new Blob(['ISO-10303-21; CADVANTA STEP OUTPUT']),
  }).result;
}`;

    case 'mongodb_atlas':
      return `// MongoDB Atlas Document Client (Mongoose / MongoClient)
import { MongoClient } from 'mongodb';

const client = new MongoClient('${config.endpoint}');

export async function upsertCADDocument() {
  await client.connect();
  const db = client.db('${config.secondaryKey || 'cadvanta_cad_engine'}');
  const collection = db.collection('${config.targetResource}');

  const result = await collection.updateOne(
    { model_id: '${part.id}' },
    {
      $set: {
        name: '${part.name}',
        part_type: '${part.part_type}',
        material: ${JSON.stringify(part.material, null, 2)},
        parameters: ${JSON.stringify(part.parameters, null, 2)},
        updated_at: new Date()
      }
    },
    { upsert: true }
  );

  console.log('MongoDB Atlas update result:', result);
}`;

    case 'clerk':
      return `// Clerk Engineering Identity & JWT Auth Guard
import { Clerk } from '@clerk/clerk-js';

const clerk = new Clerk('${config.apiKey}');
await clerk.load();

export function verifyEngineerSession() {
  if (!clerk.user) {
    throw new Error('Unauthorized engineer access');
  }

  const organization = clerk.organization;
  console.log('Signed in as:', clerk.user.primaryEmailAddress?.emailAddress);
  console.log('Active CAD Workspace Org:', organization?.name || 'Personal Workspace');

  return {
    userId: clerk.user.id,
    orgId: organization?.id,
    role: organization?.membership?.role || 'engineer_viewer'
  };
}`;

    case 'cloudflare':
      return `// Cloudflare Worker + D1 SQL + R2 CAD Bucket
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/cad/sync') {
      const part = await request.json();

      // 1. Write metadata to Cloudflare D1 SQL
      await env.D1_CADVANTA_METRICS_DB.prepare(
        'INSERT OR REPLACE INTO cad_models (id, name, type, updated_at) VALUES (?, ?, ?, ?)'
      ).bind(part.id, part.name, part.part_type, Date.now()).run();

      // 2. Put geometry buffer to Cloudflare R2 Object Storage
      await env.R2_CAD_ASSETS.put(
        \`models/\${part.id}.json\`,
        JSON.stringify(part),
        { httpMetadata: { contentType: 'application/json' } }
      );

      return new Response(JSON.stringify({ success: true, latency: '18ms' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('CADVANTA Cloudflare Edge Router', { status: 200 });
  }
};`;

    default:
      return '// SDK Snippet';
  }
}
