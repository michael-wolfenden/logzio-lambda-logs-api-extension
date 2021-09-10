import { bool, loadEnv, num, str } from '@src/utils/env'
import faker from 'faker'

test('str returns environment variable if present', () => {
  const randomString = faker.random.alphaNumeric(10)
  const stubProcessEnv = { SOME_ENV_VARIABLE: randomString }

  const actual = loadEnv({ SOME_ENV_VARIABLE: str() }, stubProcessEnv)
  expect(actual.SOME_ENV_VARIABLE).toStrictEqual(randomString)
})

test('str throws if environment variable is not present', () => {
  const loadingAMissingVariable = () =>
    loadEnv({ MISSING_ENV_VARIABLE: str() }, {})

  expect(loadingAMissingVariable).toThrow(
    `Environment variable 'MISSING_ENV_VARIABLE' was not defined and no default was provided`,
  )
})

test('str allows defaulting environment variable if not present', () => {
  const randomFallback = faker.random.alphaNumeric(10)

  const actual = loadEnv({ MISSING_ENV_VARIABLE: str(randomFallback) }, {})
  expect(actual.MISSING_ENV_VARIABLE).toStrictEqual(randomFallback)
})

test('num returns environment variable as number if present', () => {
  const randomNumber = faker.datatype.number()
  const stubProcessEnv = { SOME_ENV_VARIABLE: String(randomNumber) }

  const actual = loadEnv({ SOME_ENV_VARIABLE: num() }, stubProcessEnv)
  expect(actual.SOME_ENV_VARIABLE).toStrictEqual(randomNumber)
})

test('num throws if environment variable is present but not a number', () => {
  const someVariablesThatsNotANumber = 'some string value'
  const stubProcessEnv = { SOME_ENV_VARIABLE: someVariablesThatsNotANumber }

  const loadingANonNumbericVariable = () =>
    loadEnv({ SOME_ENV_VARIABLE: num() }, stubProcessEnv)

  expect(loadingANonNumbericVariable).toThrow(
    `Environment variable 'SOME_ENV_VARIABLE' is required to be numeric but could not parse 'some string value' as a number`,
  )
})

test('num throws if environment variable is not present', () => {
  const loadingAMissingVariable = () =>
    loadEnv({ MISSING_ENV_VARIABLE: num() }, {})

  expect(loadingAMissingVariable).toThrow(
    `Environment variable 'MISSING_ENV_VARIABLE' was not defined and no default was provided`,
  )
})

test('num allows defaulting environment variable if not present', () => {
  const randomFallback = faker.datatype.number()

  const actual = loadEnv({ MISSING_ENV_VARIABLE: num(randomFallback) }, {})
  expect(actual.MISSING_ENV_VARIABLE).toStrictEqual(randomFallback)
})

test('num returns environment variable as number if present', () => {
  const randomNumber = faker.datatype.number()
  const stubProcessEnv = { SOME_ENV_VARIABLE: String(randomNumber) }

  const actual = loadEnv({ SOME_ENV_VARIABLE: num() }, stubProcessEnv)
  expect(actual.SOME_ENV_VARIABLE).toStrictEqual(randomNumber)
})

test('bool throws if environment variable is present but not a boolean', () => {
  const someVariableThatsNotABoolean = 'some string value'
  const stubProcessEnv = { SOME_ENV_VARIABLE: someVariableThatsNotABoolean }

  const loadingANonBooleanVariable = () =>
    loadEnv({ SOME_ENV_VARIABLE: bool() }, stubProcessEnv)

  expect(loadingANonBooleanVariable).toThrow(
    `Environment variable 'SOME_ENV_VARIABLE' is required to be a boolean but could not parse 'some string value' as a boolean`,
  )
})

test('bool throws if environment variable is not present', () => {
  const loadingAMissingVariable = () =>
    loadEnv({ MISSING_ENV_VARIABLE: bool() }, {})

  expect(loadingAMissingVariable).toThrow(
    `Environment variable 'MISSING_ENV_VARIABLE' was not defined and no default was provided`,
  )
})

test('bool allows defaulting environment variable if not present', () => {
  const randomFallback = faker.datatype.boolean()

  const actual = loadEnv({ MISSING_ENV_VARIABLE: bool(randomFallback) }, {})
  expect(actual.MISSING_ENV_VARIABLE).toStrictEqual(randomFallback)
})

test('bool returns environment variable as number if bool', () => {
  const randomBoolean = faker.datatype.boolean()
  const stubProcessEnv = { SOME_ENV_VARIABLE: String(randomBoolean) }

  const actual = loadEnv({ SOME_ENV_VARIABLE: bool() }, stubProcessEnv)
  expect(actual.SOME_ENV_VARIABLE).toStrictEqual(randomBoolean)
})
