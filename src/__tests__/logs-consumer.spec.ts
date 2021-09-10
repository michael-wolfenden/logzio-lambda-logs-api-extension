import { createLogsConsumer } from '@src/logs-consumer'
import debug from 'debug'
import fetch from 'node-fetch'

const cleanups: Array<() => Promise<void>> = []

afterEach(() => {
  jest.restoreAllMocks()
})

afterEach(async () => {
  await Promise.all(cleanups.map((cleanup) => cleanup()))
})

test('process queue processes all accumulated logs', async () => {
  const sendMock = jest.fn().mockImplementation()

  const logsConsumer = createLogsConsumer(
    'localhost',
    3000,
    { send: sendMock },
    debug('stub-logger'),
  )

  await logsConsumer.start()
  cleanups.push(() => logsConsumer.stop())

  await fetch('http://localhost:3000', {
    method: 'post',
    body: JSON.stringify([
      {
        time: '2021-08-19T02:34:07.436Z',
        type: 'function',
        record: `LOG MESSAGE 1`,
      },
      {
        time: '2021-08-19T02:34:07.436Z',
        type: 'function',
        record: `LOG MESSAGE 2`,
      },
    ]),
  })

  await fetch('http://localhost:3000', {
    method: 'post',
    body: JSON.stringify([
      {
        time: '2021-08-19T02:34:07.436Z',
        type: 'function',
        record: `LOG MESSAGE 3`,
      },
      {
        time: '2021-08-19T02:34:07.436Z',
        type: 'function',
        record: `LOG MESSAGE 4`,
      },
    ]),
  })

  await logsConsumer.processQueue()

  expect(sendMock).toHaveBeenCalledTimes(1)
  expect(sendMock).toHaveBeenLastCalledWith([
    {
      time: '2021-08-19T02:34:07.436Z',
      type: 'function',
      record: `LOG MESSAGE 1`,
    },
    {
      time: '2021-08-19T02:34:07.436Z',
      type: 'function',
      record: `LOG MESSAGE 2`,
    },
    {
      time: '2021-08-19T02:34:07.436Z',
      type: 'function',
      record: `LOG MESSAGE 3`,
    },
    {
      time: '2021-08-19T02:34:07.436Z',
      type: 'function',
      record: `LOG MESSAGE 4`,
    },
  ])
})

test('process queue clears accumulated logs after processing', async () => {
  const sendMock = jest.fn().mockImplementation()

  const logsConsumer = createLogsConsumer(
    'localhost',
    3000,
    { send: sendMock },
    debug('stub-logger'),
  )

  await logsConsumer.start()
  cleanups.push(() => logsConsumer.stop())

  await fetch('http://localhost:3000', {
    method: 'post',
    body: JSON.stringify([
      {
        time: '2021-08-19T02:34:07.436Z',
        type: 'function',
        record: `LOG MESSAGE 1`,
      },
    ]),
  })

  await logsConsumer.processQueue()

  expect(sendMock).toHaveBeenCalledTimes(1)
  expect(sendMock).toHaveBeenLastCalledWith([
    {
      time: '2021-08-19T02:34:07.436Z',
      type: 'function',
      record: `LOG MESSAGE 1`,
    },
  ])

  await fetch('http://localhost:3000', {
    method: 'post',
    body: JSON.stringify([
      {
        time: '2021-08-19T02:34:07.436Z',
        type: 'function',
        record: `LOG MESSAGE 2`,
      },
    ]),
  })

  await logsConsumer.processQueue()

  expect(sendMock).toHaveBeenCalledTimes(2)
  expect(sendMock).toHaveBeenLastCalledWith([
    {
      time: '2021-08-19T02:34:07.436Z',
      type: 'function',
      record: `LOG MESSAGE 2`,
    },
  ])

  await logsConsumer.processQueue()

  // expect that send did not get called again
  expect(sendMock).toHaveBeenCalledTimes(2)
})

test('stop processes any remaining logs messages in the queue before shutdown', async () => {
  const sendMock = jest.fn().mockImplementation()

  const logsConsumer = createLogsConsumer(
    'localhost',
    3000,
    { send: sendMock },
    debug('stub-logger'),
  )

  await logsConsumer.start()
  cleanups.push(() => logsConsumer.stop())

  await fetch('http://localhost:3000', {
    method: 'post',
    body: JSON.stringify([
      {
        time: '2021-08-19T02:34:07.436Z',
        type: 'function',
        record: `LOG MESSAGE 1`,
      },
    ]),
  })

  await logsConsumer.stop()

  expect(sendMock).toHaveBeenCalledTimes(1)
  expect(sendMock).toHaveBeenLastCalledWith([
    {
      time: '2021-08-19T02:34:07.436Z',
      type: 'function',
      record: `LOG MESSAGE 1`,
    },
  ])
})
