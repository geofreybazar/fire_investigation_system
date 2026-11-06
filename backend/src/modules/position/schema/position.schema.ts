import { z } from 'zod';
import { normalizInput } from '../../../common/utils/normalizeInput.js';

export const positionSchema = z.object({
  name: z.string().min(5).transform(normalizInput),
});

export type PositionInput = z.infer<typeof positionSchema>;
