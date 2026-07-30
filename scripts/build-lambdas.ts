import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_ROOT = path.resolve(__dirname, '..');
const LAMBDAS_DIR = path.resolve(BACKEND_ROOT, 'src/lambdas');
const DIST_DIR = path.resolve(BACKEND_ROOT, 'dist');

async function buildLambdas() {
  console.log('🚀 Starting Lambda compilation with esbuild...');

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  if (!fs.existsSync(LAMBDAS_DIR)) {
    console.log(`⚠️ Warning: ${LAMBDAS_DIR} does not exist. Skipping Lambda build.`);
    return;
  }

  const entries = fs.readdirSync(LAMBDAS_DIR, { withFileTypes: true });
  const lambdaFolders = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

  if (lambdaFolders.length === 0) {
    console.log('ℹ️ No lambda subdirectories found in src/lambdas/.');
    return;
  }

  for (const lambdaName of lambdaFolders) {
    const lambdaDir = path.join(LAMBDAS_DIR, lambdaName);

    // Check possible entry points (handler.ts, index.ts)
    let entryPoint: string | null = null;
    const possibleEntries = ['handler.ts', 'index.ts', 'controller.ts', 'processor.ts'];

    for (const file of possibleEntries) {
      const fullPath = path.join(lambdaDir, file);
      if (fs.existsSync(fullPath)) {
        entryPoint = fullPath;
        break;
      }
    }

    if (!entryPoint) {
      console.warn(
        `⚠️ Warning: No entry file (${possibleEntries.join(', ')}) found for lambda '${lambdaName}' in ${lambdaDir}. Skipping.`
      );
      continue;
    }

    console.log(
      `📦 Compiling Lambda [${lambdaName}] from entry point: ${path.relative(BACKEND_ROOT, entryPoint)}`
    );

    const tempOutputDir = path.join(DIST_DIR, lambdaName);
    const outFile = path.join(tempOutputDir, 'index.js');

    // Compile with esbuild
    await esbuild.build({
      entryPoints: [entryPoint],
      outfile: outFile,
      bundle: true,
      minify: true,
      sourcemap: false,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      external: ['@aws-sdk/*'],
      banner: {
        js: `import { createRequire } from "module"; const require = createRequire(import.meta.url);`,
      },
    });

    // Create .zip file using AdmZip
    const zip = new AdmZip();
    zip.addLocalFile(outFile);

    const distZipPath = path.join(DIST_DIR, `${lambdaName}.zip`);
    zip.writeZip(distZipPath);

    console.log(
      `✅ Successfully generated deployment package: ${path.relative(BACKEND_ROOT, distZipPath)}`
    );
  }

  console.log('🎉 All Lambda functions compiled and packaged successfully!');
}

buildLambdas().catch((err) => {
  console.error('❌ Build failed with error:', err);
  process.exit(1);
});
