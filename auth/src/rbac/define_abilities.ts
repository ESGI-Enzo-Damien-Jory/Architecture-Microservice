import { AbilityBuilder, createMongoAbility } from "@casl/ability";

export const define_abilities_for = (role: string) => {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  if (role === "client") {
    can("create", "Order");
    can("read", "Order", { ownerId: "self" });
  }

  if (role === "cook") {
    can("update", "Order");
    can("read", "Order");
  }

  if (role === "delivery") {
    can("read", "Order");
    can("update", "Order", { status: "ready" });
  }

  if (role === "admin") {
    can("manage", "all");
  }

  return build();
};
  