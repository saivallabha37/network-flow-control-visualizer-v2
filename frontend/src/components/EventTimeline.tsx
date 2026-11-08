import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SimulationEvent } from '@agent';
import { ListFilter, ArrowDownCircle, Search, X } from 'lucide-react';

export type TimelineFilter = 'ALL' | 'DATA' | 'ACK' | 'TIMEOUT' | 'FAULTS';

interface EventTimelineProps {
  events: ReadonlyArray<SimulationEvent>;
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
}) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter events by category and search term
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // 1. Category Filter
      if (activeFilter === 'DATA') {
        const isData =
          evt.type === 'FRAME_TRANSMITTED' ||
          evt.type === 'FRAME_DELIVERED' ||
          evt.type === 'RETRANSMISSION' ||
          evt.type === 'FRAME_BUFFERED' ||
          evt.type === 'PAYLOAD_DELIVERED';
        if (!isData) return false;
      } else if (activeFilter === 'ACK') {
        const isAck =
          evt.type === 'ACK_TRANSMITTED' ||
          evt.type === 'ACK_DELIVERED' ||
          evt.type === 'SENDER_WINDOW_SLID';
        if (!isAck) return false;
      } else if (activeFilter === 'TIMEOUT') {
        if (evt.type !== 'TIMEOUT') return false;
      } else if (activeFilter === 'FAULTS') {
        const isFault =
          evt.type === 'FRAME_DROPPED' ||
          evt.type === 'ACK_DROPPED' ||
          evt.type === 'FRAME_CORRUPTED' ||
          evt.type === 'PACKET_DROPPED' ||
          evt.type === 'SIMULATION_FAILED';
        if (!isFault) return false;
      }

      // 2. Text Search Filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.trim().toLowerCase();
        const desc = (evt.details.description || '').toLowerCase();
        const type = evt.type.toLowerCase();
        const seqMatch = evt.details.seqNum !== undefined && String(evt.details.seqNum).includes(query);
        const ackMatch = evt.details.ackNum !== undefined && String(evt.details.ackNum).includes(query);
        const payloadMatch =
          evt.details.payload !== undefined &&
          String(evt.details.payload).toLowerCase().includes(query);

        if (!desc.includes(query) && !type.includes(query) && !seqMatch && !ackMatch && !payloadMatch) {
          return false;
        }
      }

      return true;
    });
  }, [events, activeFilter, searchQuery]);

  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [filteredEvents, autoScroll]);

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'FRAME_TRANSMITTED':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      case 'ACK_TRANSMITTED':
      case 'ACK_DELIVERED':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'FRAME_DROPPED':
      case 'ACK_DROPPED':
      case 'PACKET_DROPPED':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30 font-semibold';
      case 'FRAME_CORRUPTED':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30 font-semibold';
      case 'TIMEOUT':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold';
      case 'RETRANSMISSION':
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30 font-semibold';
      case 'FRAME_BUFFERED':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold';
      case 'PAYLOAD_DELIVERED':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold';
      case 'SIMULATION_COMPLETED':
        return 'bg-emerald-600/20 text-emerald-200 border-emerald-500/40 font-bold';
      case 'SIMULATION_FAILED':
      case 'SIMULATION_STOPPED':
        return 'bg-rose-600/20 text-rose-200 border-rose-500/40 font-bold';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const filterButtons: Array<{ id: TimelineFilter; label: string }> = [
    { id: 'ALL', label: 'All' },
    { id: 'DATA', label: 'DATA' },
    { id: 'ACK', label: 'ACKs' },
    { id: 'TIMEOUT', label: 'Timeouts' },
    { id: 'FAULTS', label: 'Drops / Faults' },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col h-[400px]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-2">
          <ListFilter className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Chronological Event Timeline</h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {filteredEvents.length} / {events.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setAutoScroll((prev) => !prev)}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${
            autoScroll
              ? 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
          title="Toggle automatic scrolling to latest event"
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
          <span>Auto-scroll</span>
        </button>
      </div>

      {/* Pill Filter Bar and Search Box */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 py-2.5 border-b border-slate-800/80 text-xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filterButtons.map((btn) => {
            const isSelected = activeFilter === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setActiveFilter(btn.id)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[160px] sm:w-48">
          <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search seq, ACK, data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-7 py-1 text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Events Scroll Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs mt-2 pr-1"
      >
        {filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic">
            <span>No matching events found.</span>
            <span className="text-[11px] mt-1 text-slate-600">
              {events.length === 0 ? 'Start the simulation to record protocol events.' : 'Try adjusting the active filter or search query.'}
            </span>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isSelected = selectedEventId === evt.id;
            const badgeClass = getEventBadge(evt.type);

            return (
              <div
                key={evt.id}
                onClick={() => onSelectEvent(isSelected ? null : evt.id)}
                className={`py-2 px-2.5 rounded-md transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-950/50 border border-indigo-500/50 shadow-sm ring-1 ring-indigo-500/30'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <span className="text-[11px] text-slate-500 shrink-0 w-14">
                    +{evt.virtualTimestamp}ms
                  </span>

                  <span className={`text-[10px] px-2 py-0.5 rounded border shrink-0 ${badgeClass}`}>
                    {evt.type}
                  </span>

                  <span className="text-slate-300 truncate text-[11px]">
                    {evt.details.description || evt.type}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-[10px] text-slate-500 shrink-0">
                  {evt.details.seqNum !== undefined && (
                    <span className="text-indigo-400">Seq #{evt.details.seqNum}</span>
                  )}
                  {evt.details.ackNum !== undefined && (
                    <span className="text-cyan-400">ACK #{evt.details.ackNum}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
