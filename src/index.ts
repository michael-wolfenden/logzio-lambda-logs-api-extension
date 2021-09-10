#!/usr/bin/env node
import { createExtensionClient } from '@src/clients/lambda/extensions-client'
import { createLogsClient } from '@src/clients/lambda/logs-client'
import { createLogzioClient } from '@src/clients/logzio/logzio-client'
import { createLogsConsumer } from '@src/logs-consumer'
import { bool, loadEnv, num, str } from '@src/utils/env'
import debug from 'debug'
import { basename } from 'path'

const extensionName = basename(__dirname)
const logger = debug(extensionName)

const defaults = {
  logsServerAddress: 'sandbox',
  logsServerPort: 3000,
  enablePlatformMsgs: false,
  timeoutMs: 1_000,
  maxBytes: 262_144,
  maxItems: 1_000,
}

const env = loadEnv({
  AWS_LAMBDA_RUNTIME_API: str(),
  LOGZIO_LOGS_TOKEN: str(),
  LOGZIO_LISTENER: str(),
  LOGS_API_ENABLE_PLATFORM_MSGS: bool(defaults.enablePlatformMsgs),
  LOGS_API_TIMEOUT_MS: num(defaults.timeoutMs),
  LOGS_API_MAX_BYTES: num(defaults.maxBytes),
  LOGS_API_MAX_ITEMS: num(defaults.maxItems),
})

const extensionClient = createExtensionClient(
  env.AWS_LAMBDA_RUNTIME_API,
  extensionName,
  logger,
)

const logsClient = createLogsClient(env.AWS_LAMBDA_RUNTIME_API, logger)

const logzioClient = createLogzioClient(
  env.LOGZIO_LOGS_TOKEN,
  env.LOGZIO_LISTENER,
  logger,
)

const logsConsumer = createLogsConsumer(
  defaults.logsServerAddress,
  defaults.logsServerPort,
  logzioClient,
  logger,
)

async function main() {
  process.on('SIGINT', async () => await handleShutdown('SIGINT'))
  process.on('SIGTERM', async () => await handleShutdown('SIGTERM'))

  logger('registering extension %s', extensionName)

  const { extensionId } = await extensionClient.register({
    events: ['INVOKE', 'SHUTDOWN'],
  })

  logger('extensionId %s', extensionId)

  await logsConsumer.start()

  logger('subscribing to logs')

  await logsClient.subscribe(extensionId, {
    destination: {
      protocol: 'HTTP',
      URI: `http://${defaults.logsServerAddress}:${defaults.logsServerPort}`,
    },
    types: env.LOGS_API_ENABLE_PLATFORM_MSGS
      ? ['function', 'platform']
      : ['function'],
    buffering: {
      timeoutMs: env.LOGS_API_TIMEOUT_MS,
      maxBytes: env.LOGS_API_MAX_BYTES,
      maxItems: env.LOGS_API_MAX_ITEMS,
    },
    schemaVersion: '2021-03-18',
  })

  while (true) {
    const event = await extensionClient.next({
      extensionId: extensionId,
    })

    switch (event.eventType) {
      case 'SHUTDOWN':
        await handleShutdown(event.eventType)
        break
      case 'INVOKE':
        await handleInvoke()
        break
      default:
        throw new Error(`unknown event: ${event.eventType}`)
    }
  }
}

async function handleShutdown(eventType: string) {
  logger('received %s, stopping logs consumer', eventType)
  await logsConsumer.stop()

  logger('exiting process')
  process.exit(0)
}

async function handleInvoke() {
  logger('received INVOKED, processing log queue')
  await logsConsumer.processQueue()
}

main().catch((error) => {
  logger('An unhandled error occured: %o', error)
  process.exit(1)
})
