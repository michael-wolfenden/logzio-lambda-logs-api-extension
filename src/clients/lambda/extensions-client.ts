import { fetchJson } from '@src/utils/fetch-utils'
import { Debugger } from 'debug'

interface RegisterRequest {
  events: Array<'INVOKE' | 'SHUTDOWN'>
}

interface RegisterResponse {
  functionName: string
  functionVersion: string
  handler: string
}

interface NextRequest {
  extensionId: string
}

interface NextResponse {
  eventType: 'INVOKE' | 'SHUTDOWN'
  deadlineMs: number
  requestId: string
  invokedFunctionArn: string
  tracing: {
    type: string
    value: string
  }
}

function createExtensionClient(
  baseURL: string,
  extensionName: string,
  logger: Debugger,
) {
  const extensionBaseUrl = `http://${baseURL}/2020-01-01/extension`

  async function register(request: RegisterRequest): Promise<
    RegisterResponse & {
      extensionId: string
    }
  > {
    const [registerResponse, response] = await fetchJson<RegisterResponse>(
      logger,
      `${extensionBaseUrl}/register`,
      {
        method: 'post',
        body: JSON.stringify(request),
        headers: {
          'Content-Type': 'application/json',
          'Lambda-Extension-Name': extensionName,
        },
      },
    )

    const lambdaExtensionIdentifier = response.headers.get(
      'lambda-extension-identifier',
    )

    if (lambdaExtensionIdentifier == null)
      throw new Error(
        'Register request failed to return lambda-extension-identifier header',
      )

    return {
      ...registerResponse,
      extensionId: lambdaExtensionIdentifier,
    }
  }

  async function next(request: NextRequest): Promise<NextResponse> {
    const [response] = await fetchJson<NextResponse>(
      logger,
      `${extensionBaseUrl}/event/next`,
      {
        method: 'get',
        headers: {
          'Content-Type': 'application/json',
          'Lambda-Extension-Identifier': request.extensionId,
        },
      },
    )

    return response
  }

  return {
    register,
    next,
  }
}

export { createExtensionClient }
export type { NextRequest, NextResponse, RegisterRequest, RegisterResponse }
