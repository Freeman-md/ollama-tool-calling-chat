import type { Tool } from "ollama";
import { z } from "zod";
import { ToolDispatchError } from "../errors";

export const name = "celsius_to_fahrenheit";
export const description = "Convert a temperature in degrees Celsius to degrees Fahrenheit.";
export const celsiusConversionSchema = z.object({ celsius: z.number() });

export const definition: Tool = {
  type: "function",
  function: {
    name,
    description,
    parameters: z.toJSONSchema(celsiusConversionSchema, {
      io: "input",
    }) as Tool["function"]["parameters"],
  },
};

export const conversions = {
  celsiusToFahrenheit(celsius: number) {
    return (celsius * 9) / 5 + 32;
  },
};

export function prepare(arguments_: unknown): () => string {
  const result = celsiusConversionSchema.safeParse(arguments_);
  if (!result.success) {
    throw new ToolDispatchError(
      "The conversion tool requires a numeric celsius argument.",
      400,
    );
  }

  return () => String(conversions.celsiusToFahrenheit(result.data.celsius));
}
