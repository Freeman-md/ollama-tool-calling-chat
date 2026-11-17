import assert from "node:assert/strict";
import test from "node:test";
import { dispatchToolCalls, conversions } from "../modules/chat/tools.ts";

const celsiusCall = (celsius) => ({
  function: {
    name: "celsius_to_fahrenheit",
    arguments: { celsius },
  },
});

test("dispatches multiple calls in order and returns matching tool results", (t) => {
  const conversionSpy = t.mock.method(conversions, "celsiusToFahrenheit", (celsius) => (celsius * 9) / 5 + 32);

  const result = dispatchToolCalls([celsiusCall(0), celsiusCall(20)]);

  assert.deepEqual(result.toolNames, ["celsius_to_fahrenheit", "celsius_to_fahrenheit"]);
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
    () => dispatchToolCalls([celsiusCall(20), { function: { name: "celsius_to_fahrenheit", arguments: {} } }]),
    { message: "The conversion tool requires a numeric celsius argument." },
  );
  assert.equal(conversionSpy.mock.callCount(), 0);
});
