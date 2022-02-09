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

  if (is<SlackWebhook>(webhook)) {
    let text = "";
    if (webhook.text) {
      text += webhook.text
      if (webhook.attachments) {
        text += "\n"
      }
    }
    let attachmentAuthor: string | undefined;
    if (webhook.attachments) {
      webhook.attachments.forEach(v => {
        if (v.title) {
          text += v.title
          text += "\n"
        }
        if (v.text) {
          text += v.text
        }
        if (v.author_name) {
          attachmentAuthor = v.author_name;
        }
      })
    }
    content.text = textTransform(text);

    if (webhook.mrkdwn) {
      logger.debug(
        'Received a markdown-formatted webhook, but markdown is not supported.',
      );
    }
    content.username = webhook.username ? webhook.username : attachmentAuthor;
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
