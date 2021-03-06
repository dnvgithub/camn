export interface LoggerOptions {
  logToDB?: boolean;
  /**
   * 'log' | 'console' | 'warn' | 'error' | 'info'. Default: 'log'
   */
  level?: any;
  /**
   * Should log group be collapsed? default: false
   */
  collapsed?: boolean;
  /**
   * Print duration with action? default: true
   */
  duration?: boolean;
  /**
   * Print timestamp with action? default: true
   */
  timestamp?: boolean;
  filter?: LoggerFilterOption;
  /**
   * Transform state before print default: state => state
   */
  stateTransformer?: (state: Object) => Object;
  /**
   * Transform action before print default: actn => actn
   */
  actionTransformer?: (actn: Object) => Object;
  colors?: LoggerColorsOption;
}

export interface LoggerFilterOption {
  /**
   * Only print actions included in this list - has priority over blacklist
   */
  whitelist?: string[];
  /**
   * Only print actions that are NOT included in this list
   */
  blacklist?: string[];
}

export interface LoggerColorsOption {
  title: (action: Object) => string;
  prevState: (prevState: Object) => string;
  action: (action: Object) => string;
  nextState: (nextState: Object) => string;
  error: (error: any, prevState: Object) => string;
}

export interface LogMsg {
  username: string;
  application: string;
  action: string;
  details: string;
  timestamp: string;
}
