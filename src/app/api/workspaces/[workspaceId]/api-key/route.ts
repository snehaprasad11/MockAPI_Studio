import { createApiKey, getApiKeyPrefix, hashApiKey } from "@/lib/api-keys";
import { execute } from "@/lib/db";
import { badRequest, serverError, unauthorized } from "@/lib/responses";
import { getCurrentUser } from "@/lib/session";
import { ensureObjectBody } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { workspaceId } = await context.params;
    const body = ensureObjectBody(await request.json());
    const enabled = Boolean(body.enabled);

    if (!enabled) {
      const result = await execute(
        `
          UPDATE workspaces
          SET
            api_key_enabled = FALSE,
            api_key_prefix = NULL,
            api_key_hash = NULL
          WHERE id = :workspaceId
            AND user_id = :userId
        `,
        { workspaceId: Number(workspaceId), userId: user.id },
      );

      if (result.affectedRows === 0) return badRequest("Workspace not found.");
      return Response.json({ enabled: false, apiKey: null, apiKeyPrefix: null });
    }

    const shouldRotate = body.rotate !== false;
    const apiKey = shouldRotate ? createApiKey() : null;

    const result = await execute(
      `
        UPDATE workspaces
        SET
          api_key_enabled = :enabled,
          api_key_prefix = CASE
            WHEN :shouldRotate THEN :apiKeyPrefix
            ELSE api_key_prefix
          END,
          api_key_hash = CASE
            WHEN :shouldRotate THEN :apiKeyHash
            ELSE api_key_hash
          END
        WHERE id = :workspaceId
          AND user_id = :userId
      `,
      {
        workspaceId: Number(workspaceId),
        userId: user.id,
        enabled,
        shouldRotate,
        apiKeyPrefix: apiKey ? getApiKeyPrefix(apiKey) : null,
        apiKeyHash: apiKey ? hashApiKey(apiKey) : null,
      },
    );

    if (result.affectedRows === 0) return badRequest("Workspace not found.");

    return Response.json({
      enabled,
      apiKey,
      apiKeyPrefix: apiKey ? getApiKeyPrefix(apiKey) : null,
    });
  } catch (error) {
    if (error instanceof Error) return badRequest(error.message);
    return serverError(error);
  }
}
