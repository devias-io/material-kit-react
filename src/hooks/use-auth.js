import { useContext } from 'react';
import { AuthContext } from 'src/contexts/auth-context';

export const useAuth = () => useContext(AuthContext);
