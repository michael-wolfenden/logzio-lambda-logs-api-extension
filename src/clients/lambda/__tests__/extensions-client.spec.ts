import {
  createExtensionClient,
  NextResponse,
  RegisterResponse,
} from '@src/clients/lambda/extensions-client'
import debug from 'debug'
import faker from 'faker'
import { Request } from 'node-fetch'

beforeEach(() => {
  fetchMock.doMock().resetMocks()
})

test('register throws when lambda-extension-identifier header not returned', async () => {
  const extensionsClient = createExtensionClient(
    'http://localhost:9000',
    'my-extension',
    debug('stub-logger'),
  )

  fetchMock.mockResponse('{}')

  await expect(() =>
    extensionsClient.register({
      events: ['INVOKE', 'SHUTDOWN'],
    }),
  ).rejects.toThrow(
    'Register request failed to return lambda-extension-identifier header',
  )
})

test('register returns lambda-extension-identifier header and response on success', async () => {
  const extensionId = faker.datatype.uuid()

  const stubResponse: RegisterResponse = {
    functionName: 'dev-logzio-my-stack-apiLambdaGET2D5CB7A7-FTMW6tIJzqAB',
    functionVersion: '$LATEST',
    handler: 'lambda.handler',
  }

  const isMatchingRegisterRequest = (request: Request) =>
    request.url === 'http://localhost:9000/2020-01-01/extension/register' &&
    request.headers.get('Lambda-Extension-Name') === 'my-extension'

  fetchMock.mockIf(isMatchingRegisterRequest, JSON.stringify(stubResponse), {
    status: 200,
    headers: { 'lambda-extension-identifier': extensionId },
  })

  const extensionsClient = createExtensionClient(
    'localhost:9000',
    'my-extension',
    debug('stub-logger'),
  )

  const response = await extensionsClient.register({
    events: ['INVOKE'],
  })

  expect(response).toStrictEqual({
    ...stubResponse,
    extensionId,
  })
})

test('next returns response on success', async () => {
  const extensionId = faker.datatype.uuid()

  const stubResponse: NextResponse = {
    eventType: 'INVOKE',
    deadlineMs: 1629160438613,
    requestId: 'e2fff896-108b-48f1-a04b-4f3087722d88',
    invokedFunctionArn:
      'arn:aws:lambda:ap-southeast-2:155970636617:function:dev-logzio-my-stack-apiLambdaGET2D5CB7A7-FTMW6tIJzqAB',
    tracing: {
      type: 'X-Amzn-Trace-Id',
      value:
        'Root=1-611b03ec-0219e5e3512081a355ebeed0;Parent=0f50577555b155f8;Sampled=1',
    },
  }

  const isMatchingNextRequest = (request: Request) =>
    request.url === 'http://localhost:9000/2020-01-01/extension/event/next' &&
    request.headers.get('Lambda-Extension-Identifier') === extensionId

  fetchMock.mockIf(isMatchingNextRequest, JSON.stringify(stubResponse))

  const extensionsClient = createExtensionClient(
    'localhost:9000',
    'my-extension',
    debug('stub-logger'),
  )

  const response = await extensionsClient.next({
    extensionId,
  })

  expect(response).toStrictEqual(stubResponse)
})
