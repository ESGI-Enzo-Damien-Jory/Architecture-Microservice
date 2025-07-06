import { AbilityBuilder, createMongoAbility } from "@casl/ability";

export const define_abilities_for = (role: string) => {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  if (role === "client") {
    can("create", "Commande");
    can("read", "Commande", { ownerId: "self" });
  }

  if (role === "cook") {
    can("update", "Commande");
    can("read", "Commande");
  }

  if (role === "delivery") {
    can("read", "Commande");
    can("update", "Commande", { status: "ready" });
  }

  if (role === "admin") {
    can("manage", "all");
  }

  return build();
};
  