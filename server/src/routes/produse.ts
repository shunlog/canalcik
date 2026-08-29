import { Hono } from "hono";
import { loadCategoriiProduse } from "../produseData.ts";

export const produse = new Hono();

// Parsed once at startup: the source CSV does not change at runtime.
const categoriiProduse = loadCategoriiProduse();

produse.get("/", (c) => c.json(categoriiProduse));
