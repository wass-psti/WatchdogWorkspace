import { useState, useEffect } from 'react';
import BoardSDK from '@material/api/BoardSDK.js';

const board = new BoardSDK();
let cachedUsers = null;

export function useBoardUsers() {
  const [users, setUsers] = useState(cachedUsers || []);
  const [loading, setLoading] = useState(!cachedUsers);

  useEffect(() => {
    if (cachedUsers) return;
    board.users.boardSubscribers().execute()
      .then(subs => { cachedUsers = subs; setUsers(subs); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { users, loading };
}
