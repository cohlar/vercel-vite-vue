import { headerKeys, InngestCommHandler, queryKeys, type ServeHandler } from 'inngest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * An example serve handler to demonstrate how to create a custom serve handler
 * for a framework or runtime of your choice.
 *
 * If you build a handler for your framework, please consider contributing it
 * back to the Inngest project so that others can use it too!
 *
 * @example
 * ```ts
 * import { serve } from "./my-handler";
 * import fns from "~/inngest";
 *
 * export const handler = serve("My App", fns);
 * ```
 *
 * We export a `serve` function that uses the `ServeHandler` type to match the
 * signature of the `serve` function in `inngest`. This function takes a name or
 * Inngest instance, an object of functions, and an options object.
 */
export const serve: ServeHandler = (nameOrInngest, fns, opts) => {
  const handler = new InngestCommHandler(
    'vercel/node',
    nameOrInngest,
    fns,
    opts,
    (request: VercelRequest, _response: VercelResponse) => {
      const url = new URL(request.url || '', `https://${request.headers.host || ''}`)
      return {
        url,
        register: () => {
          if (request.method === 'PUT') {
            return {
              deployId: url.searchParams.get(queryKeys.DeployId) as string
            }
          }
        },
        run: () => {
          if (request.method === 'POST') {
            return {
              data: request.body,
              fnId: url.searchParams.get(queryKeys.FnId) as string,
              stepId: url.searchParams.get(queryKeys.StepId) as string,
              signature: request.headers[headerKeys.Signature] as string
            }
          }
        },
        view: () => {
          if (request.method === 'GET') {
            return {
              isIntrospection: url.searchParams.has(queryKeys.Introspect)
            }
          }
        }
      }
    },
    ({ body, status, headers }, request, response): void => {
      Object.entries(headers).forEach(([name, value]) => {
        response.setHeader(name, value)
      })

      response.status(status).json({
        body,
        query: request.query,
        cookies: request.cookies
      })
    }
  )

  return handler.createHandler()
}
