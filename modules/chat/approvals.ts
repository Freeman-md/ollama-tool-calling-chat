import { randomUUID } from "node:crypto";
import { ToolDispatchError } from "./errors";
import type {
  ApprovalAction,
  ApprovalProposal,
  ApprovalReceipt,
  ApprovalRequest,
} from "./types";

const proposalLifetimeMs = 5 * 60 * 1000;

export type ApprovalTurn = Readonly<{ sessionId: string }>;

type StoredProposal = {
  turn: ApprovalTurn;
  expiresAt: number;
  state: { status: "pending"; action: ApprovalAction } | ApprovalReceipt;
};

const activeTurns = new Map<string, ApprovalTurn>();
const proposals = new Map<string, StoredProposal>();

export const approvalService = {
  beginTurn(sessionId: string): ApprovalTurn {
    // Pending proposals belong to the exact turn object that created them.
    const turn = { sessionId };
    activeTurns.set(sessionId, turn);
    return turn;
  },

  propose(turn: ApprovalTurn, actions: ApprovalAction[]): ApprovalProposal[] {
    if (activeTurns.get(turn.sessionId) !== turn) {
      throw new ToolDispatchError(
        "A newer chat message closed this proposal.",
        409,
      );
    }

    const expiresAt = Date.now() + proposalLifetimeMs;
    return actions.map((action) => {
      const id = randomUUID();
      proposals.set(id, {
        turn,
        expiresAt,
        state: { status: "pending", action },
      });
      return {
        id,
        expiresAt,
        preview: action.preview,
        buttons: action.buttons,
      };
    });
  },

  getReceipt(
    sessionId: string,
    proposalId: string,
  ): ApprovalReceipt | undefined {
    const proposal = proposals.get(proposalId);
    if (
      !proposal ||
      proposal.turn.sessionId !== sessionId ||
      proposal.state.status === "pending"
    ) {
      return undefined;
    }
    return proposal.state;
  },

  decide(
    sessionId: string,
    { proposalId, decision }: ApprovalRequest,
  ): ApprovalReceipt {
    const proposal = proposals.get(proposalId);
    if (!proposal || proposal.turn.sessionId !== sessionId) {
      throw new ToolDispatchError("This change could not be found.", 404);
    }

    const { state } = proposal;
    const status = decision === "approve" ? "approved" : "cancelled";
    if (state.status !== "pending") {
      if (state.status === status) {
        return state;
      }
      const message =
        state.status === "approved"
          ? "This change has already been approved."
          : "This change was cancelled.";
      throw new ToolDispatchError(message, 409);
    }

    if (activeTurns.get(sessionId) !== proposal.turn) {
      throw new ToolDispatchError(
        "A newer chat message closed this proposal.",
        409,
      );
    }
    if (Date.now() >= proposal.expiresAt) {
      throw new ToolDispatchError(
        "This change expired. Ask for it again.",
        410,
      );
    }
    if (!state.action.isCurrent()) {
      throw new ToolDispatchError(
        "This change is out of date. Ask for it again.",
        409,
      );
    }

    // Capture the receipt in the same synchronous turn so retries can replay it.
    const result =
      decision === "approve"
        ? state.action.execute()
        : state.action.cancelledReceipt();
    const receipt: ApprovalReceipt = {
      ...result,
      proposalId,
      buttonLabel: state.action.buttons[decision],
      status,
    };
    proposal.state = receipt;
    return receipt;
  },
};
