import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthPayload extends JwtPayload {
  userId: string;
  email: string;
  plan: string;
}

export function verifyToken(token?: string): AuthPayload {
  if (!token) {
    throw new Error('Token not provided');
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}
