import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatMessage } from "@/app/_components/ChatMessage";
import {
  closePendingProposals,
  completeReply,
  recordApprovalReceipt,
  setApprovalReplyState,
  toChatMessage,
} from "@/app/_lib/chat-transcript";

function readProposal() {
  return {
    id: randomUUID(),
    expiresAt: Date.now() + 300000,
    buttons: { approve: "Show collection", cancel: "Keep it private" },
    preview: {
      kind: "read",
      title: "View collection",
      description: "Share the collection details in chat.",
    },
  };
}

function assistantReply(proposal) {
  return {
    id: 1,
    role: "assistant",
    content: "Review the request below.",
    approvals: [proposal],
  };
}

function renderMessage(message) {
  return renderToStaticMarkup(
    createElement(ChatMessage, { message, isBusy: false }),
  );
}

test("records each receipt and appends exactly one button label and pending reply", () => {
  for (const [decision, status] of [
    ["approve", "approved"],
    ["cancel", "cancelled"],
  ]) {
    const proposal = readProposal();
    const reply = assistantReply(proposal);
    const receipt = {
      kind: "read",
      proposalId: proposal.id,
      status,
      buttonLabel: proposal.buttons[decision],
      outcome: "Server confirmed the decision.",
    };
    const messages = recordApprovalReceipt([reply], reply.id, 2, 3, receipt);
    assert.deepEqual(messages[0].approvals[0].receipt, receipt);
    assert.deepEqual(messages[1], {
      id: 2,
      role: "user",
      content: proposal.buttons[decision],
      approvalProposalId: proposal.id,
    });
    assert.deepEqual(messages[2], {
      id: 3,
      role: "assistant",
      content: "",
      isPending: true,
      approvalReplyFor: proposal.id,
    });
    assert.equal(messages.length, 3);
    assert.strictEqual(
      recordApprovalReceipt(messages, reply.id, 4, 5, receipt),
      messages,
    );
    assert.deepEqual(closePendingProposals(messages), messages);
    assert.match(
      renderMessage(messages[0]),
      /role="status">Server confirmed the decision\./,
    );
    assert.equal(
      renderMessage(messages[1]),
      `<article class="message user"><p>${proposal.buttons[decision]}</p></article>`,
    );
    assert.deepEqual(messages.map(toChatMessage), [
      { role: "assistant", content: reply.content },
      {
        role: "user",
        content: proposal.buttons[decision],
        approvalProposalId: proposal.id,
      },
      { role: "assistant", content: "" },
    ]);
  }
});

test("a failed reply preserves the receipt and retries in the same assistant slot", () => {
  const proposal = readProposal();
  const reply = assistantReply(proposal);
  const receipt = {
    kind: "read",
    proposalId: proposal.id,
    status: "approved",
    buttonLabel: proposal.buttons.approve,
    outcome: "Collection details were shared.",
  };
  const messages = recordApprovalReceipt([reply], reply.id, 2, 3, receipt);
  const failed = setApprovalReplyState(messages, 3, {
    isPending: false,
    replyError: "Ollama is offline.",
  });
  assert.deepEqual(failed.slice(0, 2), messages.slice(0, 2));
  assert.match(
    renderMessage(failed[2]),
    /role="alert">Ollama is offline\.[\s\S]*<button[^>]*>Retry reply<\/button>/,
  );
  const retry = setApprovalReplyState(failed, 3, { isPending: true });
  assert.equal(retry[2].approvalReplyFor, proposal.id);
  assert.equal(retry[2].replyError, undefined);
  const complete = completeReply(retry, 3, {
    content: "The collection details are now visible.",
  });
  assert.equal(complete.length, 3);
  assert.deepEqual(complete.slice(0, 2), messages.slice(0, 2));
  assert.equal(complete[2].id, 3);
  assert.match(
    renderMessage(complete[2]),
    /The collection details are now visible\./,
  );
});

test("leaves closed previews visible with both configured buttons disabled", () => {
  const proposal = readProposal();
  const [reply] = closePendingProposals([assistantReply(proposal)]);
  assert.deepEqual(reply.approvals, [{ ...proposal, closed: true }]);
  const html = renderMessage(reply);
  assert.match(html, /View collection/);
  assert.match(html, /role="status">Proposal closed/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Show collection<\/button>/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Keep it private<\/button>/);
});

test("marks proposals from late replies closed after a newer normal message", () => {
  const late = { id: 1, role: "assistant", content: "", isPending: true };
  const shopper = { id: 2, role: "user", content: "Approve" };
  const proposal = readProposal();
  const [reply] = completeReply([late, shopper], late.id, {
    content: "Review the request below.",
    approvals: [proposal],
  });
  assert.deepEqual(reply.approvals, [{ ...proposal, closed: true }]);
  assert.equal(toChatMessage(shopper).approvalProposalId, undefined);
  assert.match(renderMessage(reply), /Proposal closed/);
});
