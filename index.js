#!/usr/bin/env node

const minimist = require('minimist');
const sharp = require('sharp');
const readdirp = require('readdirp');
const fs = require('fs');
const path = require('path');
const yesno = require('yesno');

const DEFAULT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

const argv = minimist(process.argv.slice(2));

if (argv.help || argv.h) {
  console.log('Usage: shrinkem [path] [options]');
  console.log();
  console.log('Options:')
  console.log('  -v, --verbose', '    verbose output');
  console.log('  -h, --help', '       print help information');
  console.log('  -d, --dry', '        dry run (do not shrink images)');
  console.log('  -k, --keep', '       keep original images (appends .orig)');
  console.log('  -w, --width', '      max width');
  console.log('  -h, --height', '     max height');
  console.log('  -s, --size', '       max width and height');
  console.log('  -e, --ext', '        image extension to find (multi-arg)');
  console.log('  -f, --force', '      continue without confirmation');
  console.log('  -i, --ignore', '     ignore files/directories (multi-arg)');
  console.log();
  console.log('Default extensions:');
  console.log(`  ${DEFAULT_EXTENSIONS.join(', ')}`);
  process.exit();
}

function ensureArrayArg(obj) {
  if (obj === true) {
    // arg was passed as a bool
    return null;
  }
  if (obj) {
    if (!Array.isArray(obj)) {
      return [obj];
    }
    return obj;
  }
}

const FORCE          = argv.f || argv.force || false;
const VERBOSE        = argv.v || argv.verbose || false;
const DRY_RUN        = argv.d || argv.dry || false;
const KEEP_ORIGINALS = argv.k || argv.keep || false;
const MAX_WIDTH      = argv.w || argv.width || argv.s || argv.size;
const MAX_HEIGHT     = argv.h || argv.height || argv.s || argv.size;
const EXTENSIONS     = ensureArrayArg(argv.e || argv.ext) || DEFAULT_EXTENSIONS;
const IGNORE         = ensureArrayArg(argv.i || argv.ignore) || [];
const ROOT           = path.resolve(argv._[0] || '.');

const hasWidth       = Number.isFinite(MAX_WIDTH);
const hasHeight      = Number.isFinite(MAX_HEIGHT);

if (!hasWidth && !hasHeight) {
  console.error('You must specify size or width and/or height');
  process.exit(1);
}

if (VERBOSE) {
  console.log('[force]', FORCE);
  console.log('[verbose]', VERBOSE);
  console.log('[max width]', MAX_WIDTH || 'auto');
  console.log('[max height]', MAX_HEIGHT || 'auto');
  console.log('[dry run]', DRY_RUN);
  console.log('[keep originals]', KEEP_ORIGINALS);
  console.log('[root]', ROOT);
  console.log('[extensions]', EXTENSIONS.join(', ') || '<none>');
  console.log('[ignore]', IGNORE.join(', ') || '<none>');
  console.log('--');
}

const sharpResizeOpts = {
  fit: 'inside',
  withoutEnlargement: true
};

main();

async function main() {
  const fileFilter = EXTENSIONS.map(ext => `*.${ext}`);
  const entries = await readdirp.promise(ROOT, { fileFilter });
  const unfilteredFiles = entries.map(e => e.fullPath);

  const files = unfilteredFiles.filter(file => {
    for (const ignore of IGNORE) {
      if (file.includes(ignore)) {
        if (VERBOSE) {
          console.log('[exclude]', file);
        }
        return false;  
      }
    }
    if (VERBOSE) {
      console.log('[include]', file)
    }
    return true;
  });

  if (files.length == 0) {
    console.log('No images found ¯\\_(ツ)_/¯');
    return;
  }

  const filesToShrink = [];
  for (const file of files) {
    if (await checkFile(file)) {
      filesToShrink.push(file);
    }
  }

  const count = filesToShrink.length;
  if (count <= 0) {
    console.log('No images to shrink ¯\\_(ツ)_/¯');
    return;
  }

  const shouldContinue = FORCE || await yesno({ question: `Found ${count} image${count > 1 ? 's' : ''}. Continue?` });
  if (shouldContinue) {
    for (const file of filesToShrink) {
      await shrinkFile(file);
    }
  }
}

async function checkFile(file) {
  const rel = path.relative(ROOT, file);
  const tmp = file + '.tmp';

  try {
    const img = sharp(file);
    const { width, height } = await img.metadata();

    const shouldResize = (hasWidth && width > MAX_WIDTH) || (hasHeight && height > MAX_HEIGHT);
    if (!shouldResize) {
      if (VERBOSE) {
        console.log('[skip]', rel, '(ok)');
      }
      return false;
    }

    if (fs.existsSync(tmp)) {
      console.log('[skip]', rel, '(tmp file already exists)');
      return false;
    }

    console.log('[found]', rel, '|', `${width}x${height}`);
    return true;
  } catch (err) {
    console.error('[error]', rel, `(${err.message})`);
  }
}

async function shrinkFile(file) {
  const rel = path.relative(ROOT, file);
  const tmp = file + '.tmp';

  try {
    const oldStat = await fs.promises.stat(file);

    if (DRY_RUN) {
      console.log('[dry]', rel, '|', prettyBytes(oldStat.size), '-> ?');
      return;
    }

    if (KEEP_ORIGINALS) {
      const orig = file + '.orig';
      await fs.promises.copyFile(file, orig);
    }

    await sharp(file)
      .resize(MAX_WIDTH, MAX_HEIGHT, sharpResizeOpts)
      .rotate()
      .toFile(tmp);

    await fs.promises.rename(tmp, file);

    const newStat = await fs.promises.stat(file);
    const oldSize = oldStat.size;
    const newSize = newStat.size;
    const sizeDiff = ((newSize - oldSize) / oldSize * 100).toFixed(1) + '%';
    console.log('[shrink]', rel, '|', prettyBytes(oldStat.size), '->', prettyBytes(newStat.size), '|', sizeDiff);
    
  } catch (err) {
    console.error('[error]', rel, `(${err.message})`);
  }
}

function prettyBytes(bytes) {
  const units = ['B', 'kB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log10(bytes) / 3), units.length - 1);
	bytes /= 1000 ** exponent;
  const unit = units[exponent];
  return bytes.toFixed(1) + ' ' + unit;
}
