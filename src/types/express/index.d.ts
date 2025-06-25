import { User } from 'generated/prisma/client';

declare global {
  namespace Express {
    interface User {
      user: User;
    }
  }
}
