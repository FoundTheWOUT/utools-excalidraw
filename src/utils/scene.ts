import { nanoid } from "nanoid";
import type { Scene } from "@/types";

export const six_nanoid = () => nanoid(6);

export const newAScene = ({
  id,
  ...rest
}: Partial<Scene> & { name: string }): Scene => {
  return {
    id: id ? id : six_nanoid(),
    sticky: rest.sticky ?? false,
    deleted: rest.deleted ?? false,
    deletedAt: rest.deletedAt ?? null,
    name: rest.name,
    data: rest.data,
  };
};
