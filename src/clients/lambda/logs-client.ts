import { fetchJson } from '@src/utils/fetch-utils'
import { Debugger } from 'debug'

interface SubscribeRequest {
  destination: {
    protocol: 'HTTP' | 'HTTPS'
    URI: string
  }
  types: Array<'platform' | 'extension' | 'function'>
  buffering: {
    timeoutMs?: number
    maxBytes?: number
    maxItems?: number
  }
  schemaVersion: '2020-08-15' | '2021-03-18'
}

interface SubscribeResponse {
  message: string
}

function createLogsClient(baseURL: string, logger: Debugger) {
  const logsBaseUrl = `http://${baseURL}/2020-08-15/logs`

  async function subscribe(
    extensionId: string,
    request: SubscribeRequest,
  ): Promise<SubscribeResponse> {
    const [response] = await fetchJson<SubscribeResponse>(logger, logsBaseUrl, {
      method: 'put',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
        'Lambda-Extension-Identifier': extensionId,
      },
    })

    return response
  }

  return { subscribe }
}
export { createLogsClient }
export type { SubscribeRequest, SubscribeResponse }
