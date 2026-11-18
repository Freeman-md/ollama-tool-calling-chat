import Image from "next/image";
import type { CSSProperties } from "react";
import type { Product } from "@/modules/catalog/types";

type ProductCardProps = {
  product: Product;
  index: number;
  recommendedProductIds: string[];
};

export function ProductCard({
  product,
  index,
  recommendedProductIds,
}: ProductCardProps) {
  const price = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(product.pricePence / 100);
  let detailsText: string;
  switch (product.category) {
    case "perfume":
      detailsText = product.details.notes.join(" · ");
      break;
    case "watch":
      detailsText = `${product.details.movement} movement · ${product.details.caseDiameterMm} mm case · ${product.details.strapMaterial} strap`;
      break;
    case "jewellery":
      detailsText = `${product.details.pieceType} · ${product.details.material} · ${product.details.lengthCm} cm`;
      break;
  }
  const staggerStyle = { "--card-index": index } as CSSProperties;
  const isRecommended = recommendedProductIds.includes(product.id);
  const cardClass = isRecommended
    ? "perfume-card is-recommended"
    : "perfume-card";

  return (
    <article className={cardClass} style={staggerStyle}>
      <Image
        src={product.image.src}
        alt={product.image.alt}
        width={480}
        height={480}
        sizes="(max-width: 600px) 150px, 200px"
      />
      <div className="perfume-card-details">
        {isRecommended && (
          <span className="recommendation-label">Recommended</span>
        )}
        <h3>{product.name}</h3>
        <span className="perfume-price">{price}</span>
        <p>{detailsText}</p>
      </div>
    </article>
  );
}
