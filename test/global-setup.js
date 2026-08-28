/* global process */
module.exports = async () => {
  const url = process.env.DATABASE_URL || '';

  const looksLikeTestDb =
    /(^|[\/_:.-])test([\/_:.-]|$)/i.test(url) ||
    /_e2e\b/i.test(url) ||
    /_test\b/i.test(url);

  if (!looksLikeTestDb) {
    throw new Error(
      [
        'Refusing to run e2e tests: DATABASE_URL does not look like a test database.',
        `  DATABASE_URL=${url}`,
        '',
        'E2E tests can erase data. Only run them against a dedicated test DB',
        'whose name contains "test" or "_e2e" (e.g. .../nestjs_test).',
        '',
        'Note: Jest sets NODE_ENV=test automatically, so it is NOT a reliable',
        'safety signal and is intentionally ignored here.',
      ].join('\n'),
    );
  }
};
