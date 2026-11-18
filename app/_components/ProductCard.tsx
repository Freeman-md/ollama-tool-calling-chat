import Image from "next/image";
import type { CSSProperties } from "react";
import type { Product } from "@/modules/catalog/types";

type ProductCardProps = { product: Product; index: number };

export function ProductCard({ product, index }: ProductCardProps) {
  const price = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(product.pricePence / 100);
  const notes = product.details.notes;
  const notesText = notes.join(" · ");
  const staggerStyle = { "--card-index": index } as CSSProperties;

  return (
    <article className="perfume-card" style={staggerStyle}>
      <Image
        src={product.image.src}
        alt={product.image.alt}
        width={480}
        height={480}
        sizes="(max-width: 600px) 150px, 200px"
      />
      <div className="perfume-card-details">
        <h3>{product.name}</h3>
        <span className="perfume-price">{price}</span>
        <p>{notesText}</p>
      </div>
    </article>
  );
}
