import cors from "cors";
import express from "express";
import { AddressInfo } from "net";
import { z } from "zod";
import { makeApi, Zodios, ZodiosInstance } from ".";

const userApi = makeApi([
  {
    method: "post",
    parameters: [{ type: "Body", name: "body", schema: z.object({}) }],
    alias: "postA",
    path: "postA",
    response: z.any(),
  },
  {
    method: "post",
    parameters: [{ type: "Body", name: "body", schema: z.void() }],
    alias: "postB",
    path: "postB",
    response: z.any(),
  },
  {
    method: "post",
    parameters: [{ type: "Body", name: "body", schema: z.void() }],
    alias: "postC",
    path: "postC",
    response: z.any(),
  },
  {
    method: "post",
    parameters: [{ type: "Body", name: "body", schema: z.void() }],
    alias: "postD",
    path: "postD",
    response: z.any(),
  },
]);

let xApiClient: ZodiosInstance<typeof userApi>;

describe("group to avoid bug", () => {
  let app: express.Express;
  let server: ReturnType<typeof app.listen>;
  let port: number = 33323;
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(cors());
    app.all("*", (req, res) => {
      console.log("xxxx");
      res.json({ a: "b" });
    });
    server = app.listen(0);
    port = (server.address() as AddressInfo).port;

    xApiClient = new Zodios(`http://localhost:${port}`, userApi);
  });

  afterAll(() => {
    server.close();
  });

  test("should run a plugin only once per each request", async () => {
    const requestInterceptor = jest.fn(async (_, config) => {
      console.log(config.url);
      console.log(config);
      return config;
    });

    xApiClient.use({
      name: "mock request interceptor",
      request: requestInterceptor,
    });

    const x = await Promise.all([
      //
      xApiClient.postA({}),
      xApiClient.postB(),
      // xApiClient.postC(),
      // xApiClient.postD(),
    ]); //?
    expect(requestInterceptor).toBeCalledTimes(x.length);
  });
});
