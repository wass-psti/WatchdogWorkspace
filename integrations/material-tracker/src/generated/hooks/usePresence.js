import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@material/api/http';

const HEARTBEAT_MS = 30000;

export function usePresence() {
  const [otherUsers, setOtherUsers] = useState([]);
  const heartbeat = useCallback(async () => {
    try {
      const users = await apiFetch('/api/presence/heartbeat', { method: 'POST', body: '{}' });
      setOtherUsers(Array.isArray(users) ? users : []);
    } catch (err) {
      console.error('[Presence] Heartbeat failed:', err);
    }
  }, []);

  useEffect(() => {
    heartbeat();
    const interval = setInterval(heartbeat, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [heartbeat]);

  return { otherUsers };
}
