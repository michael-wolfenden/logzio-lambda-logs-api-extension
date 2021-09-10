import { parseAsLogzioLog } from '@src/clients/logzio/log-parser'
import { LogMessage } from '@src/types'

test('can parse platform logs with string record', () => {
  const log: LogMessage = {
    time: '2020-08-20T12:31:32.123Z',
    type: 'platform.fault',
    record:
      'RequestId: d783b35e-a91d-4251-af17-035953428a2c Process exited before completing request',
  }

  const logzioLog = parseAsLogzioLog(log)

  expect(logzioLog).toStrictEqual({
    '@timestamp': new Date('2020-08-20T12:31:32.123Z'),
    lambdaLogType: 'platform.fault',
    message:
      'platform.fault | RequestId: d783b35e-a91d-4251-af17-035953428a2c Process exited before completing request',
  })
})

test('can parse platform logs with json record', () => {
  const log: LogMessage = {
    time: '2020-08-20T12:31:32.123Z',
    type: 'platform.logsDropped',
    record: {
      reason:
        'Consumer seems to have fallen behind as it has not acknowledged receipt of logs.',
      droppedRecords: 123,
      droppedBytes: 12345,
    },
  }

  const logzioLog = parseAsLogzioLog(log)

  expect(logzioLog).toStrictEqual({
    '@timestamp': new Date('2020-08-20T12:31:32.123Z'),
    lambdaLogType: 'platform.logsDropped',
    message: 'platform.logsDropped',
    record: {
      droppedBytes: 12345,
      droppedRecords: 123,
      reason:
        'Consumer seems to have fallen behind as it has not acknowledged receipt of logs.',
    },
  })
})

test('can parse function logs written directly to stdout as stringified json', () => {
  const log: LogMessage = {
    time: '2021-09-07T09:49:07.667Z',
    type: 'function',
    record:
      '{"name":"my-app","hostname":"169.254.141.157","pid":18,"level":30,"customKey":"customValue","msg":"log from bunyan","time":"2021-09-07T09:49:07.667Z","v":0}\n',
  }

  const logzioLog = parseAsLogzioLog(log)

  expect(logzioLog).toStrictEqual({
    '@timestamp': new Date('2021-09-07T09:49:07.667Z'),
    lambdaLogType: 'function',
    message: 'log from bunyan',
    record: {
      customKey: 'customValue',
      hostname: '169.254.141.157',
      level: 30,
      name: 'my-app',
      pid: 18,
      time: '2021-09-07T09:49:07.667Z',
      v: 0,
    },
  })
})

test('can parse function logs written directly to stdout as a plain string', () => {
  const log: LogMessage = {
    time: '2021-09-07T09:49:07.667Z',
    type: 'function',
    record: 'plain string log',
  }

  const logzioLog = parseAsLogzioLog(log)

  expect(logzioLog).toStrictEqual({
    '@timestamp': new Date('2021-09-07T09:49:07.667Z'),
    lambdaLogType: 'function',
    message: 'plain string log',
  })
})

test('can parse function logs written to console as a plain string', () => {
  const log: LogMessage = {
    time: '2021-09-07T09:49:07.666Z',
    type: 'function',
    record:
      '2021-09-07T09:49:07.665Z\t23b8e9b1-4387-4b02-a9cb-df90d64290f9\tINFO\tlog from console.log\n',
  }

  const logzioLog = parseAsLogzioLog(log)

  expect(logzioLog).toStrictEqual({
    '@timestamp': new Date('2021-09-07T09:49:07.666Z'),
    lambdaLogType: 'function',
    level: 'INFO',
    message: 'log from console.log',
    requestId: '23b8e9b1-4387-4b02-a9cb-df90d64290f9',
  })
})

test('can parse function logs written to console as stringified json', () => {
  const log: LogMessage = {
    time: '2021-09-07T09:49:07.666Z',
    type: 'function',
    record:
      '2021-09-07T09:49:07.666Z\t23b8e9b1-4387-4b02-a9cb-df90d64290f9\tINFO\t{"message":"log from lambda-powertools-logger","customKey":"customValue","awsRegion":"ap-southeast-2","functionName":"dev-logzio-my-stack-apiLambdaGET2D5CB7A7-FTMW6tIJzqAB","functionVersion":"$LATEST","functionMemorySize":"1024","level":30,"sLevel":"INFO"}\n',
  }

  const logzioLog = parseAsLogzioLog(log)

  expect(logzioLog).toStrictEqual({
    '@timestamp': new Date('2021-09-07T09:49:07.666Z'),
    lambdaLogType: 'function',
    level: 'INFO',
    message: 'log from lambda-powertools-logger',
    record: {
      awsRegion: 'ap-southeast-2',
      customKey: 'customValue',
      functionMemorySize: '1024',
      functionName: 'dev-logzio-my-stack-apiLambdaGET2D5CB7A7-FTMW6tIJzqAB',
      functionVersion: '$LATEST',
      level: 30,
    },
    requestId: '23b8e9b1-4387-4b02-a9cb-df90d64290f9',
  })
})
