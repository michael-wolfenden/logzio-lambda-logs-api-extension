import archiver from 'archiver'
import { build } from 'esbuild'
import { createWriteStream } from 'fs'
import { copyFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import pkg from '../package.json'

const zipDir = (dir: string, outputFile: string) => {
  const archive = archiver('zip', { zlib: { level: 9 } })
  const stream = createWriteStream(outputFile)

  return new Promise<void>((resolve, reject) => {
    archive
      .directory(dir, false)
      .on('error', (err) => reject(err))
      .pipe(stream)

    stream.on('close', () => resolve())
    archive.finalize()
  })
}

const run = async () => {
  const extensionName = pkg.name

  const paths = {
    buildDir: `./dist/build`,
    entry: './src/index.js',
    outputIndex: `./dist/build/${extensionName}/index.js`,
    outputExtensionScript: `./dist/build/extensions/${extensionName}`,
    extensionZip: `./dist/extension.zip`,
    extensionScript: `extension.sh`,
  }

  console.log(`building ${extensionName}`)

  await build({
    entryPoints: [paths.entry],
    bundle: true,
    minify: true,
    platform: 'node',
    target: 'node14',
    outfile: paths.outputIndex,
  })

  console.log(
    `creating extension bash script at ${paths.outputExtensionScript}`,
  )

  await mkdir(dirname(paths.outputExtensionScript))
  await copyFile(paths.extensionScript, paths.outputExtensionScript)

  console.log(`creating extension.zip`)
  await zipDir(paths.buildDir, paths.extensionZip)

  console.log('='.repeat(75))
  console.log(
    `aws lambda publish-layer-version --layer-name "${extensionName}" --region ap-southeast-2 --zip-file  "fileb://${paths.extensionZip}"`,
  )
  console.log('='.repeat(75))
}

run()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
