# Ollama Tool Calling Chat

A minimal Next.js App Router chat that talks to a local Ollama model. The server offers `celsius_to_fahrenheit` and `search_perfumes`, validating tool arguments with Zod. The perfume catalog contains fictional products.

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
