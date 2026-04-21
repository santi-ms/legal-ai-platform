/**
 * Mock determinístico del endpoint api.anthropic.com usando undici MockAgent.
 *
 * El SDK de Anthropic usa `fetch` global bajo el capó. Instalamos un
 * MockAgent que intercepta cualquier POST a /v1/messages y devuelve una
 * respuesta configurable, tipada como la real del SDK.
 *
 * No requiere `msw` ni instalaciones nuevas — undici viene built-in con Node.
 */

import { MockAgent, setGlobalDispatcher, getGlobalDispatcher, Dispatcher } from "undici";

export interface AnthropicMockOptions {
  /** Si se setea, todas las respuestas devuelven este status. */
  status?: number;
  /** Si se setea, se ignora el texto y se devuelve esto exacto. */
  body?: any;
  /** Delay artificial antes de responder (ms). Útil para testear timeouts. */
  delayMs?: number;
  /** Si se setea, devuelve este texto. */
  text?: string;
  /** Tokens input/output a reportar. */
  usage?: { input_tokens: number; output_tokens: number };
}

let mockAgent: MockAgent | null = null;
let originalDispatcher: Dispatcher | null = null;
let currentOptions: AnthropicMockOptions = {};

export function installAnthropicMock(defaultOpts: AnthropicMockOptions = {}) {
  currentOptions = defaultOpts;
  originalDispatcher = getGlobalDispatcher();
  mockAgent = new MockAgent({ connections: 1 });
  mockAgent.disableNetConnect();
  setGlobalDispatcher(mockAgent);

  const client = mockAgent.get("https://api.anthropic.com");

  // Interceptar todas las llamadas a /v1/messages (persistente).
  client
    .intercept({ path: /\/v1\/messages/, method: "POST" })
    .reply(
      () => {
        const opts = currentOptions;
        if (opts.status && opts.status >= 400) {
          return {
            statusCode: opts.status,
            data: JSON.stringify({
              type: "error",
              error: { type: "overloaded_error", message: "mock overloaded" },
            }),
            responseOptions: { headers: { "content-type": "application/json" } },
          };
        }
        const payload = opts.body ?? {
          id: "msg_test",
          type: "message",
          role: "assistant",
          model: "claude-sonnet-4-6",
          content: [{ type: "text", text: opts.text ?? "MOCK_ANTHROPIC_RESPONSE" }],
          stop_reason: "end_turn",
          usage: opts.usage ?? { input_tokens: 10, output_tokens: 10 },
        };
        return {
          statusCode: 200,
          data: JSON.stringify(payload),
          responseOptions: { headers: { "content-type": "application/json" } },
        };
      },
    )
    .persist();
}

export function setAnthropicMock(opts: AnthropicMockOptions) {
  currentOptions = opts;
}

export async function withAnthropicMock<T>(opts: AnthropicMockOptions, fn: () => Promise<T>): Promise<T> {
  const prev = currentOptions;
  currentOptions = opts;
  try {
    return await fn();
  } finally {
    currentOptions = prev;
  }
}

export async function uninstallAnthropicMock() {
  if (mockAgent) {
    await mockAgent.close();
    mockAgent = null;
  }
  if (originalDispatcher) {
    setGlobalDispatcher(originalDispatcher);
    originalDispatcher = null;
  }
}
