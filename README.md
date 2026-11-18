# Ollama Tool Calling Chat

A minimal Next.js App Router chat that talks to a local Ollama model. The server offers `list_products`, `search_products`, `get_product_by_id`, and `celsius_to_fahrenheit`, validating tool arguments with Zod. The product catalog contains fictional perfumes, shown as cards with generated product photos when a search finds matches. Sample descriptions, bottle sizes, and availability are fictional.

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
Convert 20°C to Fahrenheit
```

The assistant should answer `68°F` and show `Used celsius_to_fahrenheit` above the reply.

### Product catalog conversation

A browser conversation with local `qwen3.5:9b` produced these results:

- “Show me the products in the catalog.” used `list_products` and displayed Cedar Dusk (£40), Emberwood (£55), and Rose Veil (£32), with matching product cards. The first two were listed as in stock and Rose Veil as out of stock.
- “I want a woody fragrance for £40 or less.” used `search_products` and returned Cedar Dusk at £40, with its woody notes and card.
- “Can you tell me more details about it?” used `search_products` followed by `get_product_by_id` and reported Cedar Dusk's sample description, 50 ml bottle, notes, price and availability. In a separate run, Qwen answered the same details directly from search results without fetching by ID.
- “Is it available?” returned that Cedar Dusk was in stock. In different runs, Qwen used `search_products` or answered from the previous reply.

On an earlier repeat, Qwen supplied `"£40"` as a budget and the app returned a validation error; product search now accepts this format. The model also added descriptive flourishes beyond the catalog and once offered to add an item to a basket, which this app does not support. The guidance now explicitly excludes purchasing; a later details check did not offer it. Model output can vary and is not guaranteed to be grounded.

### Shopper demo observations

With local `qwen3.5:9b`, each prompt was tested three times in a fresh browser conversation:

- “I want a woody fragrance for £40 or less.” returned Cedar Dusk at £40 with cedarwood, sandalwood, and vetiver and the `Used search_perfumes` label in all three runs. One reply also offered more details.
- “I want a woody fragrance for £39.99 or less.” returned no match, the tool label, and one follow-up question about changing the budget or scent preference in all three runs.
- “Hey.” returned a normal greeting with no tool call in all three runs.

Earlier tests with `llama3.1:latest` produced these results:

- “I want a woody fragrance for £40 or less.” returned Cedar Dusk at £40 with cedarwood, sandalwood, and vetiver and the `Used search_perfumes` label. One response also invented a `[Brand]` placeholder that is not in the catalog.
- “I want a woody fragrance for £39.99 or less.” returned no match, the tool label, and one question about changing the budget or scent preference.
- “Hey.” did not reliably produce a tool-free greeting: the model attempted an empty perfume search in two runs and called the Celsius tool in another. These are observed model failures, not expected behavior.

Model responses can vary between runs.

For the budget-boundary smoke test with `qwen3.5:9b`:

- “I want a woody fragrance under 40 quid.” returned no match and asked about changing the budget or scent family. It called `search_perfumes` three times.
- “I want a woody fragrance for £40 or less.” returned Cedar Dusk at £40 with cedarwood, sandalwood, and vetiver.
- The follow-up “Any similar scent above £40?” returned Emberwood at £55 with oud, patchouli, and amber.
- In a fresh chat, “I want a woody fragrance above £40.” also returned Emberwood at £55 with its catalog notes.
