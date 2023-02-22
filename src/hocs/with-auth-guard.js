import { AuthGuard } from 'src/guards/auth-guard';

export const withAuthGuard = (Component) => (props) => (
  <AuthGuard>
    <Component {...props} />
  </AuthGuard>
);
