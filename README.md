# Ollama Tool Calling Chat

A minimal Next.js App Router chat that talks to a local Ollama model. The server offers tools to browse and search the fictional catalog, look up product details, and read a guest basket. Tool arguments are validated with Zod. The catalog contains perfumes, watches, and jewellery, shown as cards with generated product photos when a search finds matches. Product details and availability are fictional.

## Prerequisites

- Node.js 22 or newer and npm. The tests use Node's built-in test runner with `tsx`.
- [Ollama](https://ollama.com/download) installed and running locally.
- The model currently selected by the app, `qwen3.5:9b`.

## Setup

Install the model used by the app and the project dependencies:

```sh
ollama pull qwen3.5:9b
npm install
```

Ollama normally starts its local service when installed as a desktop app. If it is not running, start it in a separate terminal:

```sh
ollama serve
```

The app uses `qwen3.5:9b`. To download Mistral for local experimentation, run:

```sh
ollama pull mistral:latest
```

The app will continue using Qwen until the model name in `lib/config.ts` is changed.

## Run

Start the development server:

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For a production build and local production server, run:

```sh
npm run build
npm run start
```

## Test

Run formatting, lint, type checking, and deterministic tests:

```sh
npm run check
```

## Try the chat

Send an ordinary message such as:

```text
Hey
```

For a tool call, try:

```text
What woody fragrances do you have?
```

The assistant can search the catalog, show matching products below its reply, and highlight its recommendations. Cards show a compact summary by default; a detailed product lookup can show the description and full specifications. Highlights are limited to products in both the latest search and the displayed cards.

Ask “What’s in my basket?” to see the basket contents and the GBP total below the reply. To add a product, set its quantity, or remove it, ask in chat and review the proposed quantity and new total. Use **Approve** to apply the change or **Cancel** to keep the basket as it is. The selected button text appears as a shopper message, the original card shows the receipt, and Qwen acknowledges the decision. If the acknowledgement fails, use **Retry reply** to try Qwen again. Sending a normal chat message closes pending proposals, even if the reply fails. Proposals also expire after five minutes. If the basket changed since a proposal was created, ask for the change again.

Each guest starts with an empty basket. A session cookie links requests to the same basket. Restarting the server clears its in-memory baskets and proposals.

Valid `POST /api/chat` requests stream newline-delimited JSON. `activity` events carry a shopper-facing label, followed by either a `complete` event with the reply and any product cards, basket snapshot, or pending approvals, or an `error` event. Invalid requests return a JSON error before streaming. Completed activity is available above the reply in a collapsed section. `PATCH /api/chat` takes a proposal ID and an approve or cancel decision and returns the saved receipt as JSON. `POST /api/chat` with `replyToApproval` uses that guest’s receipt for a tool-free acknowledgement. The same receipt provides context for later chat turns.

### Product catalog conversation

With `qwen3.5:9b`, asking for an in-stock watch under £100 returned Harbour Classic at £89 with a recommended card. A follow-up confirmed its 38 mm case. Switching to jewellery showed Sun Disc Necklace and Silver Link Bracelet with their catalog details; asking for all watches showed both watch cards.

A browser conversation with local `qwen3.5:9b` produced these results:

- “Show me the products in the catalog.” used `list_products` and displayed Cedar Dusk (£40), Emberwood (£55), and Rose Veil (£32), with matching product cards. The first two were listed as in stock and Rose Veil as out of stock.
- “I want a woody fragrance for £40 or less.” used `search_products` and returned Cedar Dusk at £40, with its woody notes and card.
- “Can you tell me more details about it?” used `search_products` followed by `get_product_by_id` and reported Cedar Dusk's sample description, 50 ml bottle, notes, price and availability. In a separate run, Qwen answered the same details directly from search results without fetching by ID.
- “Is it available?” returned that Cedar Dusk was in stock. In different runs, Qwen used `search_products` or answered from the previous reply.

On an earlier repeat, Qwen supplied `"£40"` as a budget and the app returned a validation error. Product search now accepts this format. The model has also added descriptive flourishes beyond the catalog. Model output can vary.
