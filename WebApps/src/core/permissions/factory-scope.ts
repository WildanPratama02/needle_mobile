import { useCurrentUser } from "@/core/auth/queries";
import { useMasterData } from "@/core/master-data";

export interface Factory {
  id: string;
  code: string;
  name: string;
}

/**
 * The factories this user may act within, with real names.
 *
 * Two sources, deliberately: `GET /auth/me` says *which* factories are in
 * scope and is the authority on that; `GET /factories` supplies their code and
 * name. The scope list is never taken from the master-data response — a
 * catalogue read must not be able to widen what a user believes they can see.
 *
 * `MASTER_VIEW` is a separate permission from being scoped to a factory, so a
 * user can legitimately hold the scope and not the catalogue. When the lookup
 * is unavailable — still loading, or refused — each id falls back to standing
 * in for its own code and name. That keeps the switcher usable and keeps the
 * app's standing rule intact: show the id rather than invent a label.
 */
export function useAuthorizedFactories(): Factory[] {
  const { data: user } = useCurrentUser();
  const factoryIds = user?.factoryIds ?? [];

  const { data: factories } = useMasterData("factories", {}, factoryIds.length > 0);

  return factoryIds.map((id) => {
    const row = factories?.find((factory) => factory.id === id);
    return { id, code: row?.code ?? id, name: row?.name ?? id };
  });
}
