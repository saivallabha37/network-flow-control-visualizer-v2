export type ViewId =
  | 'overview'
  | 'auto-sim'
  | 'manual-lab'
  | 'live-udp'
  | 'comparison'
  | 'internals'
  | 'learning';

export interface NavItemConfig {
  id: ViewId;
  label: string;
  shortLabel: string;
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'info' | 'neutral';
  description: string;
  category: 'workspace' | 'live' | 'learning';
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    shortLabel: 'Overview',
    description: 'Project introduction, protocol summary & quick launch',
    category: 'workspace',
  },
  {
    id: 'auto-sim',
    label: 'Automatic Simulation',
    shortLabel: 'Auto Sim',
    badge: 'Deterministic',
    badgeVariant: 'primary',
    description: 'Deterministic virtual clock simulation & space-time bounce diagram',
    category: 'workspace',
  },
  {
    id: 'manual-lab',
    label: 'Manual Interactive Lab',
    shortLabel: 'Manual Lab',
    badge: 'Phase 3 Preview',
    badgeVariant: 'warning',
    description: 'Teacher-controlled delivery, deliberate drops & manual timeouts',
    category: 'workspace',
  },
  {
    id: 'live-udp',
    label: 'Live UDP Network',
    shortLabel: 'Live UDP',
    badge: 'Real Socket',
    badgeVariant: 'success',
    description: 'Peer-to-peer Node.js dgram UDP socket transport & telemetry',
    category: 'live',
  },
  {
    id: 'comparison',
    label: 'Protocol Comparison',
    shortLabel: 'Comparison',
    badge: 'Benchmark',
    badgeVariant: 'info',
    description: 'Side-by-side protocol benchmark matrix & efficiency metrics',
    category: 'learning',
  },
  {
    id: 'internals',
    label: 'Protocol Internals',
    shortLabel: 'Internals',
    badge: 'Architecture',
    badgeVariant: 'neutral',
    description: 'Application, Data-Link & Physical layer state transitions',
    category: 'learning',
  },
  {
    id: 'learning',
    label: 'Learning Centre',
    shortLabel: 'Learning',
    badge: 'Curriculum',
    badgeVariant: 'neutral',
    description: 'Concepts, glossary, sequence ambiguity lesson & scenarios',
    category: 'learning',
  },
];

