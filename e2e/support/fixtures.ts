import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import type { Portfolio, WithdrawalFilters, WithdrawalNotice } from '../../frontend/src/lib/types';
import { seededHistory, seededPortfolio } from './data';

const exec = promisify(execFile);
const root = path.resolve(__dirname, '../..');
const database = 'jdbc:h2:file:/app/data/integration;AUTO_SERVER=TRUE;LOCK_TIMEOUT=10000';
const project = process.env.E2E_COMPOSE_PROJECT ?? '';

async function compose(...args: string[]) {
  if (!/^enviro365-e2e-[a-z0-9]{8}$/.test(project)) {
    throw new Error(
      'Refusing database access outside the managed E2E Compose project. Run make test-e2e-docker.'
    );
  }
  const result = await exec(
    'docker',
    [
      'compose',
      '-p',
      project,
      '-f',
      path.join(root, 'compose.yaml'),
      '-f',
      path.join(root, 'compose.integration.yaml'),
      '-f',
      path.join(root, 'e2e/compose.yaml'),
      ...args,
    ],
    { cwd: root, timeout: 60_000, maxBuffer: 4 * 1024 * 1024 }
  );
  return result.stdout;
}

export class Backend {
  constructor(private request: APIRequestContext) {}

  async portfolio(): Promise<Portfolio> {
    const response = await this.request.get('/api/investors/1/portfolio');
    expect(response.status()).toBe(200);
    return response.json();
  }

  async history(filters: WithdrawalFilters = {}): Promise<WithdrawalNotice[]> {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) params[key] = String(value);
    }
    const response = await this.request.get('/api/investors/1/withdrawal-notices', { params });
    expect(response.status()).toBe(200);
    return response.json();
  }

  async snapshot() {
    return { portfolio: await this.portfolio(), history: await this.history() };
  }

  create(productId: number, amount: number) {
    return this.request.post('/api/investors/1/withdrawal-notices', {
      data: { productId, amount },
    });
  }
}

type Fixtures = {
  investorAge: number;
  backend: Backend;
  _reset: void;
  _diagnostics: void;
};

export const test = base.extend<Fixtures, { managedEnvironment: void }>({
  investorAge: [68, { option: true }],
  managedEnvironment: [
    async ({}, use) => {
      const id = (await compose('ps', '-q', 'app')).trim();
      expect(id).not.toBe('');
      const { stdout } = await exec('docker', ['inspect', id], { timeout: 10_000 });
      const [container] = JSON.parse(stdout);
      expect(container.Config.Labels['com.docker.compose.project']).toBe(project);
      expect(container.Config.Image).toBe(`${project}:app`);
      expect(container.Config.Env).toEqual(
        expect.arrayContaining([
          `DB_URL=${database}`,
          'SEED_ENABLED=false',
          'SPRING_SQL_INIT_DATA_LOCATIONS=file:/test/seed.sql',
        ])
      );
      expect(container.HostConfig.Tmpfs['/app/data']).toContain('uid=10001,gid=10001,mode=0700');
      expect(container.Mounts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Source: path.join(root, 'e2e/seed.sql'),
            Destination: '/test/seed.sql',
            RW: false,
          }),
        ])
      );
      await use();
    },
    { scope: 'worker' },
  ],
  backend: async ({ request }, use) => {
    await use(new Backend(request));
  },
  _reset: [
    async ({ managedEnvironment, investorAge, backend }, use) => {
      void managedEnvironment;
      await compose(
        'exec',
        '-T',
        'app',
        'java',
        '-cp',
        '/tmp/h2.jar',
        'org.h2.tools.RunScript',
        '-url',
        `${database};IFEXISTS=TRUE`,
        '-user',
        'sa',
        '-script',
        '/test/seed.sql'
      );
      if (investorAge !== 68) {
        // The UI is fixed to investor 1. Change only this private fixture's birthday.
        expect([64, 65]).toContain(investorAge);
        await compose(
          'exec',
          '-T',
          'app',
          'java',
          '-cp',
          '/tmp/h2.jar',
          'org.h2.tools.Shell',
          '-url',
          `${database};IFEXISTS=TRUE`,
          '-user',
          'sa',
          '-sql',
          `UPDATE investor SET date_of_birth = DATEADD('YEAR', -${investorAge}, CURRENT_DATE) WHERE id = 1;`
        );
      }
      expect(await backend.snapshot()).toEqual({
        portfolio: seededPortfolio(investorAge),
        history: seededHistory,
      });
      await use();
    },
    { auto: true },
  ],
  _diagnostics: [
    async ({ page }, use, testInfo) => {
      const browserLog: string[] = [];
      const errors: string[] = [];
      page.on('console', (message) => browserLog.push(`[${message.type()}] ${message.text()}`));
      page.on('pageerror', (error) => {
        errors.push(error.message);
        browserLog.push(`[pageerror] ${error.stack}`);
      });
      page.on('requestfailed', (request) =>
        browserLog.push(
          `[requestfailed] ${request.method()} ${request.url()}: ${request.failure()?.errorText}`
        )
      );
      try {
        await use();
        expect(errors, 'Uncaught browser errors').toEqual([]);
      } finally {
        if (testInfo.status !== testInfo.expectedStatus || errors.length) {
          await testInfo.attach('browser.log', {
            body: browserLog.join('\n'),
            contentType: 'text/plain',
          });
          try {
            await testInfo.attach('application.log', {
              body: await compose('logs', '--no-color', '--tail', '200', 'app'),
              contentType: 'text/plain',
            });
          } catch (error) {
            await testInfo.attach('log-capture-error', {
              body: String(error),
              contentType: 'text/plain',
            });
          }
        }
      }
    },
    { auto: true },
  ],
});

export { expect };
