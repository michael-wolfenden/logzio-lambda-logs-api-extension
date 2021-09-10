import {
  createLogsClient,
  SubscribeResponse,
} from '@src/clients/lambda/logs-client'
import debug from 'debug'
import faker from 'faker'
import { Request } from 'node-fetch'

beforeEach(() => {
  fetchMock.doMock().resetMocks()
})

test('subscribe returns response on success', async () => {
  const extensionId = faker.datatype.uuid()

  const stubResponse: SubscribeResponse = {
    message: 'ok',
  }

  const isMatchingNextRequest = (request: Request) =>
    request.url === 'http://localhost:9000/2020-08-15/logs' &&
    request.headers.get('Lambda-Extension-Identifier') === extensionId

  fetchMock.mockIf(isMatchingNextRequest, JSON.stringify(stubResponse))

  const logsClient = createLogsClient('localhost:9000', debug('stub-logger'))

  const response = await logsClient.subscribe(extensionId, {
    destination: {
      protocol: 'HTTP',
      URI: `http://sandbox:3000`,
    },
    types: ['function', 'platform'],
    buffering: {
      timeoutMs: 1_000,
      maxBytes: 262_144,
      maxItems: 1_000,
    },
    schemaVersion: '2021-03-18',
  })

  expect(response).toStrictEqual(stubResponse)
})
