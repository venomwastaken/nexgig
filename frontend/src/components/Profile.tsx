import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export default function Profile() {
  const api = useApi();

  useEffect(() => {
    api.get('/me')
      .then((res) => console.log(res.data))
      .catch(console.error);
  }, []);

  return <div>Check the console / network tab</div>;
}