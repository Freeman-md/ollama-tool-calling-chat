import type { DisplayMessage } from "@/app/_hooks/use-chat";
import { AssistantActivity } from "./AssistantActivity";
import { ProductCard } from "./ProductCard";

export function ChatMessage({ message }: { message: DisplayMessage }) {
  const products = message.products ?? [];
  const hasProducts = products.length > 0;
  const messageClass = `message ${message.role}`;

  if (message.role === "user") {
    return (
      <article className={messageClass}>
        <p>{message.content}</p>
      </article>
    );
  }

  return (
    <article className={messageClass}>
      <span className="assistant-mark" aria-hidden="true">
        ✳
      </span>
      <div className="assistant-body">
        <div className="assistant-reply">
          <AssistantActivity toolNames={message.toolNames} />
          <p>{message.content}</p>
        </div>
        {hasProducts && (
          <section className="catalog-matches" aria-label="Products">
            <h2>Products</h2>
            <div
              className="catalog-grid"
              role="region"
              aria-label="Product cards"
              tabIndex={0}
            >
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
