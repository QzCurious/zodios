import cors from "cors";
import express from "express";
import { AddressInfo } from "net";
import { z } from "zod";
import { makeApi, Zodios, ZodiosInstance } from ".";
import { zodValidationPlugin } from "./plugins/zod-validation.plugin";

const userApi = makeApi([
  {
    method: "post",
    parameters: [
      {
        type: "Body",
        name: "body",
        schema: z.object({
          a: z.any(),
        }),
      },
    ],
    alias: "postA",
    path: "postA",
    response: z.any(),
  },
  {
    method: "post",
    parameters: [
      {
        type: "Body",
        name: "body",
        schema: z.object({
          b: z.any(),
        }),
      },
    ],
    alias: "postB",
    path: "postB",
    response: z.any(),
  },
]);

let xApiClient: ZodiosInstance<typeof userApi>;
let app: express.Express;
let server: ReturnType<typeof app.listen>;
let port: number = 33323;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  app.use(cors());
  app.all("*", (req, res) => {
    res.json(); // anyway, just make it response with 200
  });
  server = app.listen(0);
  port = (server.address() as AddressInfo).port;

  xApiClient = new Zodios(`http://localhost:${port}`, userApi);
});

afterAll(() => {
  server.close();
});

test("should run a plugin exactly once per each request", async () => {
  const requestInterceptor = jest.fn(async (_, config) => {
    return config;
  });

  xApiClient.use({
    name: "mock request interceptor",
    request: requestInterceptor,
  });

  const spySendRequestCount = jest.spyOn(xApiClient, "request");
  const spyZodValidationCount = jest.spyOn(zodValidationPlugin(), "request");

  const x = await Promise.all([xApiClient.postA({}), xApiClient.postB()]);

  expect(spySendRequestCount).toBeCalledTimes(x.length);
  expect(spyZodValidationCount).toBeCalledTimes(x.length);
  expect(requestInterceptor).toBeCalledTimes(x.length);
});
