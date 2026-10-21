import { z } from "zod";

export const cartItemSchema = z.object({
  restaurantSlug: z.string(),
  menuItemName: z.string(),
  quantity: z.number().int().positive(),
  priceInr: z.number().int().nonnegative(),
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema).default([]),
  restaurantSlug: z.string().optional(),
});

export const cartResponseSchema = z.object({
  items: z.array(cartItemSchema),
  subtotalInr: z.number().int().nonnegative(),
  gstInr: z.number().int().nonnegative(),
  deliveryFeeInr: z.number().int().nonnegative(),
  packagingInr: z.number().int().nonnegative(),
  totalInr: z.number().int().nonnegative(),
  restaurantSlug: z.string().optional(),
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type CartResponse = z.infer<typeof cartResponseSchema>;
