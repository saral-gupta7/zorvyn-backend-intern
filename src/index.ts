import { Elysia } from "elysia";

const PORT = process.env.PORT;

const app = new Elysia()
  .get("/health", () => "This is the health route")
  .listen(PORT);

console.log(`Ther server is listening on port ${PORT}`);
