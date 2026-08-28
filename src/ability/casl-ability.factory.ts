import { Injectable } from '@nestjs/common';
import {
  createMongoAbility,
  MongoAbility,
  MongoQuery,
  RawRuleOf,
} from '@casl/ability';
import { Role } from '@prisma/client';
import { Action, AppAbility, AuthUser, Subjects } from './ability.types';

type AppRule = RawRuleOf<MongoAbility<[Action, Subjects], MongoQuery>>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: AuthUser): AppAbility {
    const { role } = user;

    let rules: AppRule[];

    switch (role) {
      case Role.SUPER_ADMIN:
        rules = [{ action: Action.Manage, subject: 'all' }];
        break;
      case Role.ADMIN:
        rules = [
          {
            action: [Action.Read, Action.Create, Action.Update],
            subject: 'User',
            fields: ['id', 'email', 'name', 'role'],
          },
          { action: Action.Delete, subject: 'User', inverted: true },
          {
            action: [Action.Read, Action.Create, Action.Update],
            subject: ['Cat', 'Owner', 'Illness'],
          },
          {
            action: Action.Delete,
            subject: ['Cat', 'Owner', 'Illness'],
            inverted: true,
          },
        ];
        break;
      default:
        rules = [
          {
            action: [Action.Read, Action.Create, Action.Update, Action.Delete],
            subject: ['Cat', 'Owner', 'Illness'],
            conditions: { userId: user.id },
          },
          {
            action: Action.Read,
            subject: 'User',
            fields: ['id', 'email', 'name'],
            conditions: { id: user.id },
          },
        ];
    }

    return createMongoAbility<MongoAbility<[Action, Subjects], MongoQuery>>(
      rules,
    );
  }
}
