import { Debugger } from 'debug'
import fetch, { Response } from 'node-fetch'

export class HttpError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, HttpError.prototype)
  }
}

type FetchParams = Parameters<typeof fetch>

async function fetchJson<TResponse>(
  logger: Debugger,
  url: FetchParams[0],
  init?: FetchParams[1],
): Promise<[TResponse, Response]> {
  const method = (init?.method ?? 'GET').toUpperCase()
  logger('%s %s requested', method, url)

  try {
    const response = await fetch(url, init)
    const textContents = await response.text()

    if (!response.ok) {
      throw new HttpError(
        `${method} ${url} responded ${response.status} [${response.statusText}] with content: ${textContents}`,
      )
    }

    try {
      const json = JSON.parse(textContents)

      logger(
        '%s %s responded %s [%s] with json contents %o',
        method,
        url,
        response.status,
        response.statusText,
        json,
      )

      return [json as TResponse, response]
    } catch (error) {
      throw new HttpError(
        `${method} ${url} responded ${response.status} [${response.statusText}] but failed to parse contents as json: ${textContents}`,
      )
    }
  } catch (error: any) {
    if (error instanceof HttpError) throw error

    throw new HttpError(
      `${method} ${url} failed for reason: ${messageFrom(error)}`,
    )
  }
}

async function fetchText(
  logger: Debugger,
  url: FetchParams[0],
  init?: FetchParams[1],
): Promise<[string, Response]> {
  const method = (init?.method ?? 'GET').toUpperCase()

  logger('%s %s requested', method, url)

  try {
    const response = await fetch(url, init)
    const text = await response.text()

    if (!response.ok) {
      throw new HttpError(
        `${method} ${url} responded ${response.status} [${response.statusText}] with content: ${text}`,
      )
    }

    logger(
      '%s %s responded %s [%s] with text contents %o',
      method,
      url,
      response.status,
      response.statusText,
      text,
    )

    return [text, response]
  } catch (error: any) {
    if (error instanceof HttpError) throw error

    throw new HttpError(
      `${method} ${url} failed for reason: ${messageFrom(error)}`,
    )
  }
}

function messageFrom(error: any) {
  if (typeof error === 'string') return error
  if ('message' in error) return error.message

  return String(error)
}

export { fetchJson, fetchText }
