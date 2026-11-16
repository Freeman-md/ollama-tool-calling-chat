# Ollama Tool Calling Chat

A minimal Next.js App Router chat that talks to a local Ollama model. The server offers one local tool, `celsius_to_fahrenheit`, and validates its arguments with Zod before running the conversion.

## Prerequisites

- Node.js 22 or newer and npm. The test command uses Node's built-in test runner and TypeScript type stripping.
- [Ollama](https://ollama.com/download) installed and running locally.
- The model currently selected by the app, `llama3.1:latest`.

## Setup

Install the model used by the app and the project dependencies:

```sh
ollama pull llama3.1:latest
npm install
```

Ollama normally starts its local service when installed as a desktop app. If it is not running, start it in a separate terminal:

```sh
ollama serve
```

The route currently uses `llama3.1:latest`. To download Mistral for local experimentation, run:

```sh
ollama pull mistral:latest
```

The app will continue using Llama 3.1 until the model name in `app/api/chat/route.ts` is changed.

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

Run the deterministic route test:

```sh
npm test
```

It stubs Ollama to return a `celsius_to_fahrenheit` call with a missing argument and verifies that the route returns the expected error without running the conversion or making a follow-up Ollama request.

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
