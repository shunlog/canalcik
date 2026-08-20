import { serve } from "@hono/node-server";
import { app } from "./app.ts";
import { HOST, PORT } from "./env.ts";

serve({ fetch: app.fetch, hostname: HOST, port: PORT }, (info) =>
  console.log(`API canalcik: http://${info.address}:${info.port}`),
);
