import type { MongoAbility } from '@casl/ability';
import type { Role } from '@prisma/client';

export enum Action {
  Manage = 'manage',
  Read = 'read',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

export interface UserSubject {
  id: number;
}

export interface PetSubject {
  id: number;
  userId: number;
}

export interface IllnessSubject {
  id: number;
  userId: number;
  catId: number;
}

export type Subjects =
  | 'User'
  | UserSubject
  | 'Owner'
  | PetSubject
  | 'Cat'
  | 'Illness'
  | IllnessSubject
  | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}
