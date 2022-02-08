import { is } from 'typescript-is';
import * as HTMLParser from 'node-html-parser';
import { br, fmt, strong, Text } from '../formatting/formatting';
import logger from '../util/logger';
import {
  AppriseJsonWebhook_1_0,
  AppriseJsonWebhook_Unknown,
  DiscordWebhook,
  SlackWebhook,
  Turt2liveWebhook,
  WebhookContent,
} from './formats';
import { WebhookMessage } from '../pluginApi/v2';

export default function transformWebhook(
  webhook: WebhookContent,
  textTransform: (text: string) => Text,
): WebhookMessage {
  const content: WebhookMessage = {
    text: '',
  };

  if (is<DiscordWebhook>(webhook)) {
    content.text = textTransform(webhook.content);
    content.username = webhook.username;
    if (webhook.avatar_url) {
      content.icon = {
        url: webhook.avatar_url,
      };
    }
  } else if (is<AppriseJsonWebhook_1_0>(webhook)) {
    content.text = fmt(
      strong(`${textTransform(webhook.title)}`),
      br(),
      textTransform(webhook.message),
    );
  } else if (is<AppriseJsonWebhook_Unknown>(webhook)) {
    content.text = textTransform(webhook.message);
  } else if (is<SlackWebhook>(webhook)) {
    let text = webhook.text
    if (webhook.attachments) {
      text += "\n"
      webhook.attachments.forEach(v => {
        if (v.text) {
          text += v.text
        }
      })
    }
    content.text = textTransform(text);

    if (webhook.mrkdwn) {
      logger.debug(
        'Received a markdown-formatted webhook, but markdown is not supported.',
      );
    }
    content.username = webhook.username;
    if (webhook.icon_url) {
      content.icon = {
        url: webhook.icon_url,
      };
    } else if (webhook.icon_emoji) {
      content.icon = {
        emoji: webhook.icon_emoji,
      };
    }
  }

  return content;
}
