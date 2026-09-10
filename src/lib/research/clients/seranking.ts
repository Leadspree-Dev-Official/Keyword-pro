/*
 * SPDX-License-Identifier: Apache-2.0
 */

import 'server-only';

export const SERANKING_HOST = 'https://api.seranking.com';
const DEFAULT_TIMEOUT_MS = 60_000;

export type SeRankingClientCredentials = {
  apiKey: string;
};

export type SeRankingSubscription = {
  status?: string;
  units_left?: number;
  units_limit?: number;
  start_date?: string;
  expiration_date?: string;
};

export class SeRankingError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'SeRankingError';
  }
}

/**
 * Check subscription status and available balance on SE Ranking.
 * Endpoint: /v1/account/subscription (0 credits cost).
 */
export async function getSeRankingSubscription(
  apiKey: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<SeRankingSubscription> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new SeRankingError('SE Ranking API key is required.', 401);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${SERANKING_HOST}/v1/account/subscription`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${trimmed}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    const body = (await res.json().catch(() => null)) as
      | SeRankingSubscription
      | { message?: string; error?: string }
      | null;

    if (!res.ok) {
      const message =
        (body && ('message' in body ? body.message : 'error' in body ? body.error : null)) ||
        `SE Ranking returned HTTP ${res.status}`;
      throw new SeRankingError(message, res.status, body);
    }

    return (body as SeRankingSubscription) ?? {};
  } finally {
    clearTimeout(timer);
  }
}
