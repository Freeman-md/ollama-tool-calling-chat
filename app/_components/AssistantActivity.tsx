type AssistantActivityProps = { isPending?: boolean; toolNames?: string[] };

export function AssistantActivity({
  isPending = false,
  toolNames,
}: AssistantActivityProps) {
  if (isPending) {
    return (
      <article className="message assistant pending-message" role="status">
        <span className="assistant-mark" aria-hidden="true">
          ✳
        </span>
        <div className="assistant-body">
          <p>Thinking…</p>
        </div>
      </article>
    );
  }

  if (!toolNames?.length) return null;
  const summary = `Used ${toolNames.join(", ")}`;
  return <span className="tool-used-label">{summary}</span>;
}
