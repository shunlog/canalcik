import { serve } from "@hono/node-server";
import { app } from "./app.ts";
import { PORT } from "./env.ts";

serve({ fetch: app.fetch, port: PORT }, (info) =>
  console.log(`API canalcik: http://localhost:${info.port}`),
);
