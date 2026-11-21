import { randomUUID } from "node:crypto";
import { ToolDispatchError } from "./errors";
import type {
  ApprovalAction,
  ApprovalProposal,
  ApprovalRequest,
  ToolResult,
} from "./types";

const proposalLifetimeMs = 5 * 60 * 1000;

type ApprovalOutcome =
  { status: "approved"; result: ToolResult } | { status: "cancelled" };

type StoredProposal = {
  sessionId: string;
  expiresAt: number;
  state: { status: "pending"; action: ApprovalAction } | ApprovalOutcome;
};

const proposals = new Map<string, StoredProposal>();

export const approvalService = {
  propose(sessionId: string, actions: ApprovalAction[]): ApprovalProposal[] {
    const expiresAt = Date.now() + proposalLifetimeMs;
    return actions.map((action) => {
      const id = randomUUID();
      proposals.set(id, {
        sessionId,
        expiresAt,
        state: { status: "pending", action },
      });
      return { id, expiresAt, preview: action.preview };
    });
  },

  decide(
    sessionId: string,
    { proposalId, decision }: ApprovalRequest,
  ): ApprovalOutcome {
    const proposal = proposals.get(proposalId);
    if (!proposal || proposal.sessionId !== sessionId) {
      throw new ToolDispatchError("This change could not be found.", 404);
    }

    const { state } = proposal;
    if (state.status === "approved") {
      if (decision === "approve") {
        return state;
      }
      throw new ToolDispatchError(
        "This change has already been approved.",
        409,
      );
    }
    if (state.status === "cancelled") {
      if (decision === "cancel") {
        return state;
      }
      throw new ToolDispatchError("This change was cancelled.", 409);
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

    if (decision === "cancel") {
      proposal.state = { status: "cancelled" };
    } else {
      // Execute and record the outcome in the same synchronous turn.
      proposal.state = { status: "approved", result: state.action.execute() };
    }
    return proposal.state;
  },
};
