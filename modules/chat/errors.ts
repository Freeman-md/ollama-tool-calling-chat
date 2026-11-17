export class ToolDispatchError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ToolDispatchError";
    this.status = status;
  }
}

export class ChatAgentError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ChatAgentError";
    this.status = status;
  }
}
