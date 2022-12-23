import express from "express";
import { AddressInfo } from "net";
import { z } from "zod";
import { makeErrors } from "./api";
import { omit, pick } from "./utils";
import { Zodios } from "./zodios";
import { isErrorFromAlias } from "./zodios-error.utils";

describe("omit", () => {
  it("should be defined", () => {
    expect(omit).toBeDefined();
  });

  it("should support undefined parameters", () => {
    const obj: any = undefined;
    expect(omit(obj, ["a"])).toEqual({});
  });

  it("should remove the given keys from the object", () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
    };

    expect(omit(obj, ["a"])).toEqual({
      b: 2,
      c: 3,
    });
  });

  it("should accept to remove all keys from object", () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
    };

    expect(omit(obj, ["a", "b", "c"])).toEqual({});
  });
});

describe("pick", () => {
  it("should be defined", () => {
    expect(pick).toBeDefined();
  });

  it("should support undefined parameters", () => {
    const obj: any = undefined;
    expect(pick(obj, ["a"])).toEqual({});
  });

  it("should pick the given keys from the object", () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
    };

    expect(pick(obj, ["a"])).toEqual({
      a: 1,
    });
  });

  it("should accept to pick all keys from object", () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
    };

    expect(pick(obj, ["a", "b", "c"])).toEqual(obj);
  });
});

describe("xxx", () => {
  let app: express.Express;
  let server: ReturnType<typeof app.listen>;
  let port: number;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.post("/:id", (req, res) => {
      res.status(400).json({ msg: `given id is not exist` });
    });
    server = app.listen(0);
    port = (server.address() as AddressInfo).port;
  });

  afterAll(() => {
    server.close();
  });

  it("findEndpointErrorsByAlias should match error from a mutation alias which has path parameter", async () => {
    const zodios = new Zodios(`http://localhost:${port}`, [
      {
        method: "post",
        path: "/:id",
        alias: "update",
        parameters: [
          {
            name: "name",
            type: "Body",
            schema: z.object({
              name: z.string(),
            }),
          },
        ],
        response: z.any(),
        errors: makeErrors([
          {
            status: 400,
            schema: z.object({ msg: z.string() }),
          },
        ]),
      },
    ]);
    try {
      const response = await zodios.update(
        { name: "post" },
        { params: { id: "some-id" } }
      );
    } catch (err) {
      expect(isErrorFromAlias(zodios.api, "update", err)).toBe(true);
    }
  });
});
