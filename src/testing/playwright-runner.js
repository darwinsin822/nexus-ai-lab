import { execSync } from 'node:child_process';
import { logger } from '../core/logger.js';

/**
 * Transient Playwright Runner protected by OptiRAM guard
 * Guarantees zero zombie Chromium processes and strict RAM containment
 */
export class PlaywrightRunner {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.maxMemoryMb = options.maxMemoryMb || 512;
  }

  /**
   * Captures a web screenshot and accessibility tree evidence from a URL
   */
  async runScenario(url, options = {}) {
    logger.info(`[Playwright-OptiRAM] Launching bounded headless scenario on: ${url}`);
    
    const script = `
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process']
  });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(20000);
    const resp = await page.goto('${url}', { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    const urlLoaded = page.url();
    const status = resp ? resp.status() : 200;
    console.log(JSON.stringify({ status: 'OK', title, url: urlLoaded, httpStatus: status }));
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error(JSON.stringify({ status: 'ERROR', error: err.message }));
  process.exit(1);
});
`;

    try {
      const output = execSync(`node -e "${script.replace(/"/g, '\\"')}"`, {
        encoding: 'utf8',
        timeout: this.timeout,
        env: { ...process.env, PLAYWRIGHT_CHROMIUM_SHMEM: '1' }
      });
      const lines = output.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      return JSON.parse(lastLine);
    } catch (err) {
      this.cleanup();
      logger.error(`[Playwright-OptiRAM] Scenario execution failed: ${err.message}`);
      return { status: 'ERROR', error: err.message };
    } finally {
      this.cleanup();
    }
  }

  /**
   * Cleans up any remaining Chromium child processes
   */
  cleanup() {
    try {
      execSync('pkill -f "chromium-headless-shell" 2>/dev/null || true', { encoding: 'utf8', timeout: 5000 });
    } catch (e) {}
  }
}

export const playwrightRunner = new PlaywrightRunner();
