type LogLevel = "info" | "warn" | "error" | "success";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  tag: string;
  message: string;
  details?: any;
}

type Listener = () => void;

class ScannerLogger {
  private logs: LogEntry[] = [];
  private listeners: Set<Listener> = new Set();
  private maxLogs = 200;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clear() {
    this.logs = [];
    this.notify();
  }

  log(level: LogLevel, tag: string, message: string, details?: any) {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
      "." + String(new Date().getMilliseconds()).padStart(3, "0");

    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: time,
      level,
      tag,
      message,
      details
    };

    this.logs = [entry, ...this.logs].slice(0, this.maxLogs);
    this.notify();

    // Also output to console
    const consoleMsg = `[${tag}] ${message}`;
    if (level === "error") {
      console.error(consoleMsg, details !== undefined ? details : "");
    } else if (level === "warn") {
      console.warn(consoleMsg, details !== undefined ? details : "");
    } else {
      console.log(consoleMsg, details !== undefined ? details : "");
    }
  }

  info(tag: string, message: string, details?: any) {
    this.log("info", tag, message, details);
  }

  warn(tag: string, message: string, details?: any) {
    this.log("warn", tag, message, details);
  }

  error(tag: string, message: string, details?: any) {
    this.log("error", tag, message, details);
  }

  success(tag: string, message: string, details?: any) {
    this.log("success", tag, message, details);
  }
}

export const scannerLogger = new ScannerLogger();
