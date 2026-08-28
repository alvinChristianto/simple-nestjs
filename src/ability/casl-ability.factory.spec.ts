import { subject } from '@casl/ability';
import { Role } from '@prisma/client';
import { CaslAbilityFactory } from './casl-ability.factory';
import { Action } from './ability.types';
import type { AppAbility } from './ability.types';

describe('CaslAbilityFactory', () => {
  const factory = new CaslAbilityFactory();

  const buildUser = (id: number, role: Role) => ({
    id,
    email: `user${id}@test.com`,
    name: `User ${id}`,
    role,
  });

  const buildCat = (id: number, userId: number) => ({
    id,
    userId,
    name: 'Snowball',
    age: 2,
    breed: 'Maine Coon',
  });

  const buildOwner = (id: number, userId: number) => ({
    id,
    userId,
    name: 'Owner',
  });

  const buildIllness = (id: number, userId: number) => ({
    id,
    userId,
    catId: 1,
    name: 'Flu',
  });

  let ability: AppAbility;

  describe('SUPER_ADMIN', () => {
    beforeEach(() => {
      ability = factory.createForUser(buildUser(1, Role.SUPER_ADMIN));
    });

    it('can manage every subject', () => {
      expect(ability.can(Action.Manage, 'all')).toBe(true);

      for (const action of [
        Action.Read,
        Action.Create,
        Action.Update,
        Action.Delete,
      ]) {
        for (const type of ['User', 'Cat', 'Owner', 'Illness']) {
          expect(
            ability.can(action, subject(type as never, { id: 1, userId: 2 })),
          ).toBe(true);
        }
      }
    });
  });

  describe('ADMIN', () => {
    beforeEach(() => {
      ability = factory.createForUser(buildUser(1, Role.ADMIN));
    });

    it('can read/create/update users and pets but not delete', () => {
      for (const type of ['User', 'Cat', 'Owner', 'Illness']) {
        for (const action of [Action.Read, Action.Create, Action.Update]) {
          expect(ability.can(action, type)).toBe(true);
        }
        expect(ability.can(Action.Delete, type)).toBe(false);
      }
    });

    it('cannot delete object instances either', () => {
      expect(ability.can(Action.Delete, subject('Cat', buildCat(1, 2)))).toBe(
        false,
      );
      expect(
        ability.can(Action.Delete, subject('User', buildUser(2, Role.USER))),
      ).toBe(false);
    });

    it('can read admin-visible user fields regardless of owner', () => {
      expect(
        ability.can(
          Action.Read,
          subject('User', buildUser(2, Role.USER)),
          'role',
        ),
      ).toBe(true);
      expect(ability.can(Action.Read, subject('Cat', buildCat(1, 2)))).toBe(
        true,
      );
    });
  });

  describe('USER', () => {
    const selfId = 42;
    let userAbility: AppAbility;

    beforeEach(() => {
      userAbility = factory.createForUser(buildUser(selfId, Role.USER));
    });

    it('can manage own pets and read own profile', () => {
      for (const action of [
        Action.Read,
        Action.Create,
        Action.Update,
        Action.Delete,
      ]) {
        expect(
          userAbility.can(action, subject('Cat', buildCat(1, selfId))),
        ).toBe(true);
        expect(
          userAbility.can(action, subject('Owner', buildOwner(2, selfId))),
        ).toBe(true);
        expect(
          userAbility.can(action, subject('Illness', buildIllness(3, selfId))),
        ).toBe(true);
      }

      expect(
        userAbility.can(
          Action.Read,
          subject('User', buildUser(selfId, Role.USER)),
        ),
      ).toBe(true);
    });

    it('cannot read another users pets or profiles', () => {
      for (const action of [
        Action.Read,
        Action.Create,
        Action.Update,
        Action.Delete,
      ]) {
        expect(
          userAbility.can(action, subject('Cat', buildCat(1, selfId + 1))),
        ).toBe(false);
      }

      expect(
        userAbility.can(
          Action.Read,
          subject('User', buildUser(selfId + 1, Role.USER)),
        ),
      ).toBe(false);
    });

    it('cannot manage users or read hidden user fields', () => {
      expect(userAbility.can(Action.Create, 'User')).toBe(false);
      expect(userAbility.can(Action.Update, 'User')).toBe(false);
      expect(userAbility.can(Action.Delete, 'User')).toBe(false);

      const self = buildUser(selfId, Role.USER);
      expect(userAbility.can(Action.Read, subject('User', self), 'id')).toBe(
        true,
      );
      expect(userAbility.can(Action.Read, subject('User', self), 'role')).toBe(
        false,
      );
    });
  });
});
