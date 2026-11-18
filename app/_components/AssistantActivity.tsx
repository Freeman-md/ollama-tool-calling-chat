import type { ActivityLabel } from "@/modules/chat/types";

type AssistantActivityProps = { isPending?: boolean; steps?: ActivityLabel[] };

export function AssistantActivity({
  isPending = false,
  steps = [],
}: AssistantActivityProps) {
  if (isPending) {
    const latestStep = steps.at(-1) ?? "Thinking…";
    return (
      <article className="message assistant pending-message" role="status">
        <span className="assistant-mark" aria-hidden="true">
          ✳
        </span>
        <div className="assistant-body">
          <p>{latestStep}</p>
        </div>
      </article>
    );
  }

  if (!steps.length) {
    return null;
  }
  return (
    <details className="activity-details">
      <summary>Activity</summary>
      <ol>
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </details>
  );
}
