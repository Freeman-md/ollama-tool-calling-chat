import { useId, useState } from "react";
import type { ActivityLabel } from "@/modules/chat/types";

type AssistantActivityProps = { isPending?: boolean; steps?: ActivityLabel[] };

export function AssistantActivity({
  isPending = false,
  steps = [],
}: AssistantActivityProps) {
  const listId = useId();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isPending && !steps.length) {
    return null;
  }

  const latestStep = steps.at(-1) ?? "Thinking…";

  function toggleActivity() {
    setIsExpanded((expanded) => !expanded);
  }

  return (
    <div className="assistant-activity">
      {isPending ? (
        <p className="activity-status" role="status">
          <span className="activity-label" key={latestStep}>
            {latestStep}
            <span className="activity-sheen" aria-hidden="true">
              {latestStep}
            </span>
          </span>
        </p>
      ) : (
        <>
          <button
            className="activity-toggle"
            type="button"
            aria-controls={listId}
            aria-expanded={isExpanded}
            onClick={toggleActivity}
          >
            Completed <span className="activity-caret" aria-hidden="true" />
          </button>
          <ol className="activity-steps" id={listId} hidden={!isExpanded}>
            {steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
