import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { CaslAbilityFactory } from './casl-ability.factory';
import { CHECK_POLICIES_KEY } from './check-policies.decorator';
import type { PolicyHandler } from './policy-handler';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const handlers = this.reflector.getAllAndOverride<PolicyHandler[]>(
      CHECK_POLICIES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const ability = this.caslAbilityFactory.createForUser(user);
    request.ability = ability;

    if (!handlers || handlers.length === 0) {
      return true;
    }

    const passed = handlers.every((handler) => handler(ability));

    if (!passed) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
