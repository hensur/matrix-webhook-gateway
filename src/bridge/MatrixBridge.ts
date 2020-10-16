import {
  Bridge, MatrixUser, WeakEvent, Request,
} from 'matrix-appservice-bridge';

import MatrixEventHandler from './MatrixEventHandler';
import EventContext from './EventContext';
import logger from '../util/logger';
import AppServiceConfiguration from '../configuration/AppServiceConfiguration';

const bridgeLog = logger.getChildLogger({
  name: 'bridge',
});

export default class MatrixBridge {
  private bridge: Bridge;

  private eventHandlers: MatrixEventHandler[] = [];

  private config: AppServiceConfiguration;

  public constructor(config: AppServiceConfiguration) {
    this.bridge = new Bridge({
      homeserverUrl: config.homeserver_url,
      domain: config.homeserver_name,
      registration: config.toAppServiceRegistration(),
      disableStores: true,
      logRequestOutcome: false,
      controller: {
        onUserQuery: this.handleUserQuery.bind(this),
        onLog: this.handleLog.bind(this),
        onEvent: this.handleEvent.bind(this),
        // thirdPartyLookup: {
        //   getUser: async (proto, fields) => PossiblePromise,
        // }
      },
    });
    this.config = config;
  }

  public async sendMessage(target: string, message: string): Promise<unknown> {
    return this.bridge.getIntent().sendMessage(target, {
      body: message,
      msgtype: 'm.text',
    });
  }

  public registerHandler(eventHandler: MatrixEventHandler): void {
    this.eventHandlers.push(eventHandler);
  }

  public start(): void {
    this.bridge.run(this.config.listen_port, undefined, undefined, this.config.listen_host);
    logger.info(`Matrix bridge running on ${this.config.listen_host}:${this.config.listen_port}`);
  }

  private handleUserQuery(user: MatrixUser): Record<string, unknown> {
    logger.info(`User provision requested: ${user.localpart}:${user.host}`);
    return {};
  }

  private handleLog(text: string, isError: boolean) {
    if (isError) {
      bridgeLog.error(text);
    } else {
      bridgeLog.silly(text);
    }
  }

  private handleEvent(request: Request<WeakEvent>) {
    const event = request.getData();
    const context = new EventContext(event, this.bridge);
    const handled = this.eventHandlers.some((h) => h.handleEvent(context));

    if (!handled) {
      logger.info(`Event ignored: ${event.type}`);
    }
  }
}
