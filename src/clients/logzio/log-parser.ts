import { LogMessage } from '@src/types'

// The Logs API will send batches of events as an array of JSON objects.
// Each object will have time, type and record as the top-level keys. If
// the log message is a function message, the record element will contain
// whatever was emitted by the function to stdout. This could be a structured
// log message (JSON) or a plain string.
function parseAsLogzioLog(logMessage: LogMessage) {
  if (logMessage.type.startsWith('platform')) {
    return parsePlatformLogAsLogzioLog(logMessage)
  } else {
    return parseFunctionLogAsLogzioLog(logMessage)
  }
}

// =========================================
// PLATFORM logs:
// =========================================
// The record element of a platform log can either be json or a plain string
//
// Examples:
// {
//   "time": "2020-08-20T12:31:32.123Z",
//   "type": "platform.logsDropped",
//   "record": {
//     "reason": "Consumer seems to have fallen behind as it has not acknowledged receipt of logs.",
//     "droppedRecords": 123,
//     "droppedBytes" 12345
//   }
// }
//
// {
//   "time": "2020-08-20T12:31:32.123Z",
//   "type": "platform.fault",
//   "record": "RequestId: d783b35e-a91d-4251-af17-035953428a2c Process exited before completing request"
// }
function parsePlatformLogAsLogzioLog(logMessage: LogMessage) {
  const { type: platformType, record, time } = logMessage
  const isStringRecord = typeof record === 'string'
  const timestamp = new Date(time)

  if (isStringRecord) {
    return {
      '@timestamp': timestamp,
      lambdaLogType: logMessage.type,
      message: `${platformType} | ${record.trim()}`,
    }
  } else {
    return {
      '@timestamp': timestamp,
      lambdaLogType: logMessage.type,
      message: platformType,
      record,
    }
  }
}

// =========================================
// FUNCTION logs:
// =========================================
// If the logger used in the lambda function uses console.log under the hood
// then the format of the record elements will be a plain string like the following,
// where MESSAGE could be a plain string or stringified json:
// TIMESTAMP \t REQUESTID \t LEVEL \t MESSAGE
//
// Examples:
// {
//   "time": "2021-09-07T09:49:07.666Z",
//   "type": "function",
//   "record": "2021-09-07T09:49:07.665Z\t23b8e9b1-4387-4b02-a9cb-df90d64290f9\tINFO\tlog from console.log\n"
// }
//
// {
//   "time": "2021-09-07T09:49:07.666Z",
//   "type": "function",
//   "record": "2021-09-07T09:49:07.666Z\t23b8e9b1-4387-4b02-a9cb-df90d64290f9\tINFO\t{\"message\":\"log from lambda-powertools-logger\",\"customKey\":\"customValue\",\"awsRegion\":\"ap-southeast-2\",\"functionName\":\"dev-logzio-my-stack-apiLambdaGET2D5CB7A7-FTMW6tIJzqAB\",\"functionVersion\":\"$LATEST\",\"functionMemorySize\":\"1024\",\"level\":30,\"sLevel\":\"INFO\"}\n"
// }
//
// If the logger used in the lambda function writes directly to stdout
// then the format of the record elements will be a plain string like the following,
// where MESSAGE could be a plain string or stringified json:
// MESSAGE
//
// Example:
// {
//     "time": "2021-09-07T09:49:07.667Z",
//     "type": "function",
//     "record": "{\"name\":\"my-app\",\"hostname\":\"169.254.141.157\",\"pid\":18,\"level\":30,\"customKey\":\"customValue\",\"msg\":\"log from bunyan\",\"time\":\"2021-09-07T09:49:07.667Z\",\"v\":0}\n"
// }
//
function parseFunctionLogAsLogzioLog(logMessage: LogMessage) {
  // function log record element will be a string
  if (typeof logMessage.record !== 'string')
    throw new Error('Expected function log record element to be a string')

  const { type, record, time } = logMessage
  const trimmedRecord = record.trim()
  const timestamp = new Date(time)

  const parts = trimmedRecord.trim().split('\t', 4)
  const logInLambdaFormat = parts.length === 4

  if (logInLambdaFormat) {
    const [_, requestId, logLevel, message] = parts

    return parseLambdaFunctionLogAsLogzioLog(
      type,
      timestamp,
      requestId,
      logLevel,
      message,
    )
  } else {
    return parseStdOutLogAsLogzioLog(type, timestamp, trimmedRecord)
  }
}

function parseLambdaFunctionLogAsLogzioLog(
  type: string,
  timestamp: Date,
  requestId?: string,
  logLevel?: string,
  message?: string,
) {
  const json = tryParseJson(message)

  if (json == null) {
    return {
      '@timestamp': timestamp,
      lambdaLogType: type,
      level: logLevel,
      requestId: requestId,
      message: message?.trim(),
    }
  } else {
    // remove these properties from the record field as we will
    // make them first class properties
    const { message, msg, sLevel, ...rest } = json
    return {
      '@timestamp': timestamp,
      lambdaLogType: type,
      level: logLevel,
      requestId: requestId,
      message: message || msg,
      record: {
        ...rest,
      },
    }
  }
}

function parseStdOutLogAsLogzioLog(
  type: string,
  timestamp: Date,
  record: string,
) {
  const json = tryParseJson(record)
  if (json == null) {
    return {
      '@timestamp': timestamp,
      lambdaLogType: type,
      message: record,
    }
  } else {
    // remove these properties from the record field as we will
    // make them first class properties
    const { message, msg, ...rest } = json
    return {
      '@timestamp': timestamp,
      lambdaLogType: type,
      message: message || msg,
      record: {
        ...rest,
      },
    }
  }
}

function tryParseJson(maybeJson: string | undefined) {
  if (maybeJson == null) return null

  try {
    return JSON.parse(maybeJson.trim())
  } catch {
    return null
  }
}

export { parseAsLogzioLog }
