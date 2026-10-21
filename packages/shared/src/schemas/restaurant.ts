import { z } from "zod";

export const menuItemSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().default(""),
  priceInr: z.number().int().nonnegative(),
  veg: z.boolean().default(true),
  available: z.boolean().default(true),
});

export const restaurantSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
  cuisine: z.array(z.string().trim()).min(1),
  city: z.string().trim().min(2),
  rating: z.number().min(0).max(5).default(0),
  deliveryMinutes: z.number().int().positive(),
  isOpen: z.boolean().default(true),
  coverImage: z.string().url().optional(),
  menu: z.array(menuItemSchema).default([]),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type RestaurantInput = z.infer<typeof restaurantSchema>;
