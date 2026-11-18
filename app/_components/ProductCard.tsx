import Image from "next/image";
import type { CSSProperties } from "react";
import type { Product } from "@/modules/catalog/types";

type ProductCardProps = {
  product: Product;
  index: number;
  view: "compact" | "detailed";
  recommendedProductIds: string[];
};

export function ProductCard({
  product,
  index,
  view,
  recommendedProductIds,
}: ProductCardProps) {
  const price = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(product.pricePence / 100);
  let compactDetail: string;
  let detailsText: string;
  switch (product.category) {
    case "perfume":
      compactDetail = `${product.details.scentFamily} fragrance`;
      detailsText = `${product.details.scentFamily} · ${product.details.notes.join(" · ")} · ${product.details.bottleSizeMl} ml`;
      break;
    case "watch":
      compactDetail = `${product.details.caseDiameterMm} mm case`;
      detailsText = `${product.details.movement} movement · ${product.details.caseDiameterMm} mm case · ${product.details.strapMaterial} strap`;
      break;
    case "jewellery":
      compactDetail = `${product.details.pieceType} · ${product.details.material}`;
      detailsText = `${product.details.pieceType} · ${product.details.material} · ${product.details.lengthCm} cm`;
      break;
  }
  const stockStatus =
    product.availability === "in_stock" ? "In stock" : "Out of stock";
  const isDetailed = view === "detailed";
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
        <p>{stockStatus}</p>
        {isDetailed && <p>{product.description}</p>}
        <p>{isDetailed ? detailsText : compactDetail}</p>
      </div>
    </article>
  );
}
