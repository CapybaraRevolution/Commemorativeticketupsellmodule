/**
 * WWL (World Wide Logistics) Client Library
 * 
 * Export all WWL-related types and utilities
 */

export {
  buildWWLPayload,
  validateWWLPayload,
  formatSpecialMessage,
} from './wwlPayload';
export type { WWLOrderInput } from './wwlPayload';

export {
  WWLClient,
  createWWLClient,
} from './wwlClient';
export type { WWLConfig, WWLSubmitResult } from './wwlClient';
