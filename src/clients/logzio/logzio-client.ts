import { parseAsLogzioLog } from '@src/clients/logzio/log-parser'
import { LogMessage } from '@src/types'
import { fetchText } from '@src/utils/fetch-utils'
import { Debugger } from 'debug'

function createLogzioClient(token: string, listener: string, logger: Debugger) {
  async function send(logs: LogMessage[]) {
    const newlineSeperatePlainTextLogs = logs
      .map((log) => parseAsLogzioLog(log))
      .map((log) => JSON.stringify(log))
      .join('\n')

    await fetchText(logger, `${listener}?token=${token}`, {
      method: 'put',
      body: newlineSeperatePlainTextLogs,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }

  return { send }
}

export { createLogzioClient }
