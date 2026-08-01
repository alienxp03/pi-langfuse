import type { LangfuseObservation, LangfuseRuntime, ObservationUpdate } from "./types.js";

export async function startChildObservation({
  parent,
  runtime,
  name,
  body,
  asType,
  tags,
}: {
  parent: LangfuseObservation;
  runtime: () => Promise<LangfuseRuntime>;
  name: string;
  body?: ObservationUpdate;
  asType: "generation" | "tool" | "span";
  tags?: string[];
}): Promise<LangfuseObservation> {
  if (parent.startObservation && !tags?.length) {
    return parent.startObservation(name, body, { asType });
  }

  const rt = await runtime();
  const start = () =>
    parent.startObservation
      ? parent.startObservation(name, body, { asType })
      : rt.startObservation(name, body, { asType });

  return tags?.length ? rt.propagateAttributes({ tags }, start) : start();
}
