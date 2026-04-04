import { getSignalClass } from '../lib/indicators';

export default function SignalBadge({ signal }) {
  return <span className={`signal-badge ${getSignalClass(signal)}`}>{signal}</span>;
}
