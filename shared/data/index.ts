import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env.config';
import { dataFactory } from './data-factory';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

/**
 * Universal Test Data Manager (TDM) Hub
 * Single Source of Truth for test data across Web, Android, and iOS.
 */
export const testData = {
  /**
   * Environment variables, app binaries, and test credentials from .env
   */
  env: ENV,

  /**
   * Dynamic, conflict-free test data generator (Users, Addresses, Payments)
   */
  factory: dataFactory,

  /**
   * Loads static master data fixtures from shared/data/fixtures/<name>.json
   * @param fixtureName Name of the fixture file (with or without .json)
   */
  fixture: <T = any>(fixtureName: string): T => {
    const fileName = fixtureName.endsWith('.json') ? fixtureName : `${fixtureName}.json`;
    const fullPath = path.join(FIXTURES_DIR, fileName);

    if (!fs.existsSync(fullPath)) {
      throw new Error(
        `[TestData] Fixture file '${fileName}' not found at: ${fullPath}\n` +
        `Available fixtures: ${fs.readdirSync(FIXTURES_DIR).join(', ')}`
      );
    }

    try {
      const raw = fs.readFileSync(fullPath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (err: any) {
      throw new Error(`[TestData] Failed to parse fixture '${fileName}': ${err.message}`);
    }
  }
};

export default testData;
