const STATUS_STYLES = {
  draft:         'bg-gray-100 text-gray-600',
  open:          'bg-blue-100 text-blue-700',
  in_progress:   'bg-amber-100 text-amber-700',
  pending_parts: 'bg-orange-100 text-orange-700',
  completed:     'bg-green-100 text-green-700',
  cancelled:     'bg-red-100 text-red-600',
};

const STATUS_LABELS = {
  draft:         'Draft',
  open:          'Open',
  in_progress:   'In Progress',
  pending_parts: 'Pending Parts',
  completed:     'Completed',
  cancelled:     'Cancelled',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
