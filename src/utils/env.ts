type Validator<TOutput> = (
  processEnvKey: string,
  processEnvValue?: string,
) => TOutput
type EnvVariableToValidatorMap<TMap> = {
  [K in keyof TMap]: Validator<TMap[K]>
}

function str(defaultValue?: string): Validator<string> {
  return (processEnvKey: string, processEnvValue?: string) => {
    if (processEnvValue != null) return processEnvValue
    if (defaultValue != null) return defaultValue

    throw new Error(
      `Environment variable '${processEnvKey}' was not defined and no default was provided`,
    )
  }
}

function num(defaultValue?: number): Validator<number> {
  return (processEnvKey: string, processEnvValue?: string) => {
    if (processEnvValue != null) {
      const processEnvValueAsNumber = Number(processEnvValue)
      if (!Number.isNaN(processEnvValueAsNumber)) return processEnvValueAsNumber

      throw new Error(
        `Environment variable '${processEnvKey}' is required to be numeric but could not parse '${processEnvValue}' as a number`,
      )
    }

    if (defaultValue != null) return defaultValue

    throw new Error(
      `Environment variable '${processEnvKey}' was not defined and no default was provided`,
    )
  }
}

function bool(defaultValue?: boolean): Validator<boolean> {
  return (processEnvKey: string, processEnvValue?: string) => {
    if (processEnvValue != null) {
      const value = processEnvValue.trim().toLowerCase()
      if (value === 'true') return true
      if (value === 'false') return false

      throw new Error(
        `Environment variable '${processEnvKey}' is required to be a boolean but could not parse '${processEnvValue}' as a boolean`,
      )
    }

    if (defaultValue != null) return defaultValue

    throw new Error(
      `Environment variable '${processEnvKey}' was not defined and no default was provided`,
    )
  }
}

function loadEnv<TMap>(
  envVariableToValidatorMap: EnvVariableToValidatorMap<TMap>,
  environment = process.env,
): Readonly<TMap> {
  const result = {} as TMap

  for (const processEnvKey in envVariableToValidatorMap) {
    const validator = envVariableToValidatorMap[processEnvKey]
    result[processEnvKey] = validator(processEnvKey, environment[processEnvKey])
  }

  return result as Readonly<TMap>
}

export { loadEnv, str, num, bool }
