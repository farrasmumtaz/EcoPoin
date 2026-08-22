import { z } from "zod";

export const passbookTokenSchema = z.string().uuid();
