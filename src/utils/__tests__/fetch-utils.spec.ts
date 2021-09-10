import { fetchJson, fetchText } from '@src/utils/fetch-utils'
import debug from 'debug'

beforeEach(() => {
  fetchMock.resetMocks()
})

test('fetchJson throws when response is not ok', async () => {
  fetchMock.mockIf(
    'http://localhost/json-endpoint',
    '{"error":"server error"}',
    {
      status: 500,
    },
  )

  const fetchingANotOkRequest = () =>
    fetchJson(debug('stub-logger'), 'http://localhost/json-endpoint')

  await expect(fetchingANotOkRequest).rejects.toThrow(
    'GET http://localhost/json-endpoint responded 500 [Internal Server Error] with content: {"error":"server error"}',
  )
})

test('fetchJson throws when response is cannot be parsed as json', async () => {
  fetchMock.mockIf('http://localhost/json-endpoint', '{', {
    status: 200,
  })

  const fetchingNonJson = () =>
    fetchJson(debug('stub-logger'), 'http://localhost/json-endpoint')

  await expect(fetchingNonJson).rejects.toThrow(
    'GET http://localhost/json-endpoint responded 200 [OK] but failed to parse contents as json: {',
  )
})

test('fetchText throws when response is not ok', async () => {
  fetchMock.mockIf('http://localhost/text-endpoint', 'server error', {
    status: 500,
  })

  const fetchingANotOkRequest = () =>
    fetchText(debug('stub-logger'), 'http://localhost/text-endpoint')

  await expect(fetchingANotOkRequest).rejects.toThrow(
    'GET http://localhost/text-endpoint responded 500 [Internal Server Error] with content: server error',
  )
})
