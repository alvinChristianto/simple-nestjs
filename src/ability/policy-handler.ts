import type { AppAbility } from './ability.types';

export type PolicyHandler = (ability: AppAbility) => boolean;
