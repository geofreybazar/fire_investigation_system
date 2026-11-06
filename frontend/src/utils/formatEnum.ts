import { formatRole } from "./formatRole";

// Enum values (e.g. FIRE_OUT_UPON_ARRIVAL) as readable labels.
export const formatEnum = formatRole;

export const enumOptions = (values: readonly string[]) =>
  values.map((value) => ({ value, label: formatEnum(value) }));

export const personName = (
  person?: {
    rank: string;
    first_name: string;
    last_name: string;
  } | null,
) => (person ? `${person.rank} ${person.first_name} ${person.last_name}` : "—");
