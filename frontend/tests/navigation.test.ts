import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, ViewId } from '../src/types/navigation';

describe('V2 Navigation and Shell Architecture Tests', () => {
  it('defines all 7 required V2 destinations', () => {
    const expectedViews: ViewId[] = [
      'overview',
      'auto-sim',
      'manual-lab',
      'live-udp',
      'comparison',
      'internals',
      'learning',
    ];

    const actualViews = NAV_ITEMS.map((item) => item.id);
    expect(actualViews).toHaveLength(7);
    expect(actualViews).toEqual(expectedViews);
  });

  it('assigns descriptive labels and valid categories to all nav items', () => {
    const validCategories = ['workspace', 'live', 'learning'];

    for (const item of NAV_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.shortLabel.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
      expect(validCategories).toContain(item.category);
    }
  });

  it('verifies distinct categorization for live vs simulated environments', () => {
    const liveItems = NAV_ITEMS.filter((item) => item.category === 'live');
    expect(liveItems).toHaveLength(1);
    expect(liveItems[0].id).toBe('live-udp');
    expect(liveItems[0].badge).toBe('Real Socket');

    const workspaceItems = NAV_ITEMS.filter((item) => item.category === 'workspace');
    expect(workspaceItems.map((i) => i.id)).toEqual(['overview', 'auto-sim', 'manual-lab']);
  });
});

