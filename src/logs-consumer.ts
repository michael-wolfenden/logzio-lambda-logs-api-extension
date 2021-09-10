import { createLogzioClient } from '@src/clients/logzio/logzio-client'
import { LogMessage } from '@src/types'
import { Debugger } from 'debug'
import http from 'http'
import gracefulShutdown from 'http-graceful-shutdown'

function createLogsConsumer(
  address: string,
  port: number,
  logzioClient: ReturnType<typeof createLogzioClient>,
  logger: Debugger,
) {
  let logsQueue: LogMessage[] = []

  const server = http.createServer((request, response) => {
    let body = ''

    request.on('data', (data) => {
      logger('received log data request with contents: %s', data)
      body += data
    })

    request.on('end', () => {
      let batch = JSON.parse(body)

      logger('pushing %d items into queue', batch.length)

      if (batch.length > 0) {
        logsQueue.push(...batch)
      }

      response.writeHead(200, {})
      response.end('OK')
    })
  })

  const shutdown = gracefulShutdown(server, {
    forceExit: false,
    development: false,
    signals: '',
    preShutdown: processQueue,
  })

  async function start() {
    logger('starting logs consumer, listening at http://%s:%d', address, port)

    return new Promise((resolve, reject) => {
      server
        .listen(port, address)
        .once('listening', resolve)
        .once('error', reject)
    })
  }

  async function processQueue() {
    if (logsQueue.length == 0) return

    logger('processing %d items in queue', logsQueue.length)
    await logzioClient.send(logsQueue)
    logger('processed queue')

    logsQueue = []
  }

  async function stop() {
    logger('stopping log consumer')
    await shutdown()
  }

  return { start, stop, processQueue }
}

export { createLogsConsumer }
