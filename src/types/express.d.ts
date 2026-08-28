import 'express';
import type { Role } from '@prisma/client';
import type { AppAbility } from '../ability/ability.types';

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      name: string;
      role: Role;
    }
    interface Request {
      user?: User;
      ability?: AppAbility;
    }
  }
}

export {};
