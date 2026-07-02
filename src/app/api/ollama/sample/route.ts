import { badRequest, serverError } from "@/lib/responses";
import { ensureObjectBody } from "@/lib/validation";

type OllamaResponse = {
  response?: string;
};

export async function POST(request: Request) {
  try {
    const body = ensureObjectBody(await request.json());
    const endpointName = String(body.name ?? "API endpoint");
    const method = String(body.method ?? "GET");
    const path = String(body.path ?? "/items");
    const description = String(body.description ?? "");
    const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    const model = process.env.OLLAMA_MODEL ?? "llama3.2";

    const prompt = `
Generate only valid JSON for a fake API response.
Endpoint: ${method} ${path}
Name: ${endpointName}
Description: ${description || "No description provided"}
Return realistic frontend-test data. Do not wrap in markdown.
`;

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
    });

    if (!response.ok) {
      return badRequest("Ollama is not responding. Start Ollama locally and try again.");
    }

    const data = (await response.json()) as OllamaResponse;
    const json = extractJson(data.response ?? "");

    return Response.json({ json });
  } catch (error) {
    return serverError(error);
  }
}

function extractJson(value: string) {
  const trimmed = value.trim();
  const start = Math.min(
    ...["{", "["]
      .map((token) => trimmed.indexOf(token))
      .filter((index) => index >= 0),
  );

  if (!Number.isFinite(start)) return {};

  const jsonText = trimmed.slice(start);
  try {
    return JSON.parse(jsonText);
  } catch {
    return { sample: jsonText };
  }
}
