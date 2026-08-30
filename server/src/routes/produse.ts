import { Hono } from "hono";
import { categoriiProduse } from "../produseData.ts";

export const produse = new Hono();

produse.get("/", (c) => c.json(categoriiProduse()));
