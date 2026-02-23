import type { LeadStatus } from '../types';

const STATUS_CONFIG: Record<LeadStatus, { label: string; classes: string; dot: string }> = {
  new: { label: 'New Lead', classes: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  dm_sent: { label: 'DM Sent', classes: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  follow_up_due: { label: 'Follow-Up Due', classes: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  follow_up_sent: { label: 'Follow-Up Sent', classes: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  replied: { label: 'Replied ✓', classes: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  converted: { label: 'Converted 🎉', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  not_interested: { label: 'Not Interested', classes: 'bg-red-100 text-red-600 border-red-200', dot: 'bg-red-400' },
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export { STATUS_CONFIG };
