import type { MockEndpoint, Workspace } from "@/lib/types";

type OpenApiOperation = {
  summary: string;
  description?: string;
  responses: Record<
    string,
    {
      description: string;
      content: {
        "application/json": {
          example: unknown;
        };
      };
    }
  >;
};

type OpenApiPathItem = Partial<Record<Lowercase<MockEndpoint["method"]>, OpenApiOperation>>;

type OpenApiDocument = {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: Array<{ url: string }>;
  paths: Record<string, OpenApiPathItem>;
  components?: {
    securitySchemes: {
      MockApiKey: {
        type: "apiKey";
        in: "header";
        name: "x-mockapi-key";
      };
    };
  };
  security?: Array<{ MockApiKey: never[] }>;
};

export function buildOpenApiDocument(workspace: Workspace, endpoints: MockEndpoint[], baseUrl: string) {
  const paths = endpoints.reduce<Record<string, OpenApiPathItem>>((accumulator, endpoint) => {
    const method = endpoint.method.toLowerCase() as Lowercase<MockEndpoint["method"]>;
    const statusCode = String(endpoint.statusCode);

    accumulator[endpoint.path] = {
      ...accumulator[endpoint.path],
      [method]: {
        summary: endpoint.name,
        description: endpoint.description ?? undefined,
        responses: {
          [statusCode]: {
            description: `Mock ${statusCode} response`,
            content: {
              "application/json": {
                example: endpoint.responseBody,
              },
            },
          },
        },
      },
    };

    return accumulator;
  }, {});

  const document: OpenApiDocument = {
    openapi: "3.1.0",
    info: {
      title: `${workspace.name} Mock API`,
      description:
        workspace.description ?? "Generated mock API documentation from MockAPI Studio.",
      version: "1.0.0",
    },
    servers: [
      {
        url: `${baseUrl}/api/mock/${workspace.slug}`,
      },
    ],
    paths,
  };

  if (!workspace.apiKeyEnabled) return document;

  return {
    ...document,
    components: {
      securitySchemes: {
        MockApiKey: {
          type: "apiKey",
          in: "header",
          name: "x-mockapi-key",
        },
      },
    },
    security: [{ MockApiKey: [] }],
  };
}
