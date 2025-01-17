export type EmojiIcon = {
  emoji: string;
};

export type UrlIcon = {
  url: string;
};

export type WebhookContent =
 | SlackWebhook
 | DiscordWebhook
 | Turt2liveWebhook
 | AppriseJsonWebhook_1_0
 | AppriseJsonWebhook_Unknown;

export interface DiscordWebhook {
  content: string;
  username?: string;
  avatar_url?: string;
}

export interface SlackAttachment {
  text?: string;
  title?: string;
  author_name?: string;
}

export interface SlackWebhook {
  text?: string | null;
  username?: string | null;
  channel?: string | null;
  icon_emoji?: string | null;
  icon_url?: string | null;
  attachments?: SlackAttachment[];
  mrkdwn?: boolean | null;
}

// We can be pretty strict about parsing v1.0; its content is well defined:
// https://github.com/caronc/apprise/wiki/Notify_Custom_JSON
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface AppriseJsonWebhook_1_0 {
  version: '1.0';
  title: string;
  message: string;
  type: 'info' | 'success' | 'failure' | 'warning';
}

// If that fails, we can fall back to a best-effort match:
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface AppriseJsonWebhook_Unknown {
  version: string;
  title?: string;
  message: string;
}

export interface Turt2liveWebhook {
  text: string;
  format?: 'plain' | 'html';
  displayName?: string;
  avatarUrl?: string;
  emoji?: boolean;
}
