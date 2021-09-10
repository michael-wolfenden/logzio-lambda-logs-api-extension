import { createLogzioClient } from '@src/clients/logzio/logzio-client'
import debug from 'debug'

beforeEach(() => {
  fetchMock.doMock().resetMocks()
})

test('sends logs to logzio as newline seperated plain text', async () => {
  const structuredLog = JSON.stringify({
    awsRegion: 'ap-southeast-2',
    awsRequestId: '01f8cadc-4809-4ae4-8b00-ab92fde0d0df',
    functionMemorySize: '1024',
    functionName: 'dev-logzio-my-stack-apiLambdaGET2D5CB7A7-FTMW6tIJzqAB',
    functionVersion: '$LATEST',
    level: 20,
    message: 'SOME STRUCTURED LOG MESSAGE',
    sLevel: 'DEBUG',
  })

  const logWithStructuredLogMessage = {
    time: '2021-08-19T02:34:07.436Z',
    type: 'function',
    record: `2021-08-19T02:34:07.436Z\t01f8cadc-4809-4ae4-8b00-ab92fde0d0df\tDEBUG\t${structuredLog}`,
  }

  const lozioClient = createLogzioClient(
    'TOKEN',
    'http://listener-au.logz.io:8070',
    debug('stub-logger'),
  )

  fetchMock.mockResponse('ok')

  await lozioClient.send([
    logWithStructuredLogMessage,
    logWithStructuredLogMessage,
  ])

  expect(fetchMock.mock.calls[0]).toMatchInlineSnapshot(`
Array [
  "http://listener-au.logz.io:8070?token=TOKEN",
  Object {
    "body": "{\\"@timestamp\\":\\"2021-08-19T02:34:07.436Z\\",\\"lambdaLogType\\":\\"function\\",\\"level\\":\\"DEBUG\\",\\"requestId\\":\\"01f8cadc-4809-4ae4-8b00-ab92fde0d0df\\",\\"message\\":\\"SOME STRUCTURED LOG MESSAGE\\",\\"record\\":{\\"awsRegion\\":\\"ap-southeast-2\\",\\"awsRequestId\\":\\"01f8cadc-4809-4ae4-8b00-ab92fde0d0df\\",\\"functionMemorySize\\":\\"1024\\",\\"functionName\\":\\"dev-logzio-my-stack-apiLambdaGET2D5CB7A7-FTMW6tIJzqAB\\",\\"functionVersion\\":\\"$LATEST\\",\\"level\\":20}}
{\\"@timestamp\\":\\"2021-08-19T02:34:07.436Z\\",\\"lambdaLogType\\":\\"function\\",\\"level\\":\\"DEBUG\\",\\"requestId\\":\\"01f8cadc-4809-4ae4-8b00-ab92fde0d0df\\",\\"message\\":\\"SOME STRUCTURED LOG MESSAGE\\",\\"record\\":{\\"awsRegion\\":\\"ap-southeast-2\\",\\"awsRequestId\\":\\"01f8cadc-4809-4ae4-8b00-ab92fde0d0df\\",\\"functionMemorySize\\":\\"1024\\",\\"functionName\\":\\"dev-logzio-my-stack-apiLambdaGET2D5CB7A7-FTMW6tIJzqAB\\",\\"functionVersion\\":\\"$LATEST\\",\\"level\\":20}}",
    "headers": Object {
      "Content-Type": "text/plain",
    },
    "method": "put",
  },
]
`)
})
