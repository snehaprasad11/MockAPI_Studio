import { execute } from "@/lib/db";
import { badRequest, serverError, unauthorized } from "@/lib/responses";
import { getCurrentUser } from "@/lib/session";

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { workspaceId } = await context.params;
    const result = await execute(
      "DELETE FROM workspaces WHERE id = :workspaceId AND user_id = :userId",
      { workspaceId: Number(workspaceId), userId: user.id },
    );

    if (result.affectedRows === 0) return badRequest("Workspace not found.");
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
