import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { dispatchToolCalls } from "@/modules/chat/tools-dispatch";
import * as celsiusTool from "@/modules/chat/tools/celsius-to-fahrenheit";
import { ToolDispatchError } from "@/modules/chat/errors";

const conversions = celsiusTool.conversions;

const celsiusCall = (celsius) => ({
  function: {
    name: "celsius_to_fahrenheit",
    arguments: { celsius },
  },
});

test("dispatches multiple calls in order and returns matching tool results", (t) => {
  const conversionSpy = t.mock.method(
    conversions,
    "celsiusToFahrenheit",
    (celsius) => (celsius * 9) / 5 + 32,
  );

  const result = dispatchToolCalls([celsiusCall(0), celsiusCall(20)]);

  assert.deepEqual(result.toolNames, [
    "celsius_to_fahrenheit",
    "celsius_to_fahrenheit",
  ]);
  assert.deepEqual(result.toolResults, [
    { role: "tool", tool_name: "celsius_to_fahrenheit", content: "32" },
    { role: "tool", tool_name: "celsius_to_fahrenheit", content: "68" },
  ]);
  assert.deepEqual(
    conversionSpy.mock.calls.map((call) => call.arguments[0]),
    [0, 20],
  );
});

test("validates the whole call batch before executing any conversion", (t) => {
  const conversionSpy = t.mock.method(conversions, "celsiusToFahrenheit");

  assert.throws(
    () =>
      dispatchToolCalls([
        celsiusCall(20),
        { function: { name: "celsius_to_fahrenheit", arguments: {} } },
      ]),
    { message: "The conversion tool requires a numeric celsius argument." },
  );
  assert.equal(conversionSpy.mock.callCount(), 0);
});

test("dispatches each registered tool with its own schema and handler", () => {
  const formatSchema = z.object({
    amount: z.number(),
    style: z.enum(["short", "long"]),
  });
  const formatTool = {
    definition: {
      type: "function",
      function: {
        name: "format_amount",
        description: "Format an amount for this test.",
        parameters: z.toJSONSchema(formatSchema, { io: "input" }),
      },
    },
    prepare(arguments_) {
      const result = formatSchema.safeParse(arguments_);
      if (!result.success)
        throw new ToolDispatchError("Invalid amount arguments.", 400);
      return () => `${result.data.amount}:${result.data.style}`;
    },
  };

  const result = dispatchToolCalls(
    [
      {
        function: {
          name: "format_amount",
          arguments: { amount: 7, style: "short" },
        },
      },
      {
        function: { name: "celsius_to_fahrenheit", arguments: { celsius: 20 } },
      },
    ],
    {
      celsius_to_fahrenheit: celsiusTool,
      format_amount: formatTool,
    },
  );

  assert.deepEqual(result.toolNames, [
    "format_amount",
    "celsius_to_fahrenheit",
  ]);
  assert.deepEqual(result.toolResults, [
    { role: "tool", tool_name: "format_amount", content: "7:short" },
    { role: "tool", tool_name: "celsius_to_fahrenheit", content: "68" },
  ]);
});
