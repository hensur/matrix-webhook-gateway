import { is } from 'typescript-is';

import Webhook from '../models/Webhook';
import WebhookRepository from '../repositories/WebhookRepository';
import logger from '../util/logger';
import { WebhookContent } from './formats';
import * as v1 from '../pluginApi/v1';
import * as v2 from '../pluginApi/v2';
import PluginCollection from './PluginCollection';
import transformWebhook from './transformWebhook';
import { renderEmoji } from '../formatting/formatting';
import identity from '../util/functional';

export interface Request {
  path: string,
  body: any,
}

export interface Match {
  webhook: Webhook,
  pluginName?: string,
}

export interface WebhookResult {
  webhook: Webhook;
  content: v1.WebhookMessage | v2.WebhookMessage;
}

export interface WebhookOptions {
  replaceEmoji: boolean,
}

export default class Matcher {
  public constructor(
    private webhookRepository: WebhookRepository,
    private plugins: PluginCollection,
  ) {
  }

  public load(): Promise<void> {
    return this.plugins.load();
  }

  public async matchRequest(path: string, plugin: string | undefined): Promise<Match | undefined> {
    const webhook = await this.webhookRepository.getByPath(`/hook/${path}`);
    if (!webhook) {
      logger.debug('Webhook not found.');
      return undefined;
    }
    return {
      webhook,
      pluginName: plugin,
    };
  }

  public async executeHook(match: Match, request: Request, options: WebhookOptions): Promise<WebhookResult | undefined> {
    let payload = request.body
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (request.body !== null && request.body.payload) {
      try {
        payload = JSON.parse(request.body.payload);
      } catch (e) {
        logger.warn(`Received an empty webhook (failed to parse payload (${request.body}: ${e}): `, payload);
        return undefined;
      }
    }
    if (match.pluginName === undefined) {
      if (is<WebhookContent>(payload)) {
        const textTransform = options.replaceEmoji ? renderEmoji : identity;
        return {
          webhook: match.webhook,
          content: transformWebhook(payload, textTransform),
        };
      }
      logger.warn('Received an unrecognised webhook: ', payload);
      return undefined;
    }

    if (!this.plugins.acceptsType(match.pluginName)) {
      logger.warn(`Received an unrecognised webhook type: ${match.pluginName}`);
      return undefined;
    }

    logger.debug(`Invoking plugin: '${match.pluginName}'`);
    let content;
    try {
      content = await this.plugins.apply(payload, match.pluginName);
    } catch (error) {
      logger.error(`Error executing plugin '${match.pluginName}'`, error);
      return undefined;
    }
    if (content === undefined) {
      logger.debug(`Plugin '${match.pluginName}' rejected the webhook.`);
      return undefined;
    }
    if (is<v1.WebhookMessage>(content)) {
      return {
        webhook: match.webhook,
        content,
      };
    }
    if (is<v2.WebhookMessage>(content)) {
      return {
        webhook: match.webhook,
        content,
      };
    }
    logger.warn(`Plugin '${match.pluginName}' returned invalid content:`, content);
    return undefined;
  }
}
