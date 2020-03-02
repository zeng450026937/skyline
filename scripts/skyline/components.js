const fs = require('fs-extra');
const path = require('path');
const globby = require('globby');

const packageDir = path.resolve(__dirname, '../../');
const resolve = p => path.resolve(packageDir, p);

const warning = require('./warning');

let count = 0;

run();

async function run() {
  const root = resolve('src/components');
  const folders = fs.readdirSync(root)
    .filter(f => fs.statSync(`${ root }/${ f }`).isDirectory());

  let code = `${ warning }\n`;

  for (const folder of folders) {
    const components = await generate(
      ['*.tsx'], resolve(`${ root }/${ folder }`), resolve(`${ root }/${ folder }/index.ts`),
    );

    if (components.length) {
      code += `export * from '@/components/${ folder }';\n`;
    }
  }

  console.log();
  console.log(`total :  ${ count } components`);

  // const dist = resolve(`${ root }/index.ts`);
  const dist = resolve('src/components.ts');

  await fs.ensureFile(dist);
  await fs.writeFile(dist, code);
}

async function generate(patterns, folder, dist) {
  const dir = path.basename(folder);
  const files = await globby(patterns, { cwd: folder });
  const components = files.sort().map(file => {
    const filename = path.basename(file, '.tsx');
    const name = camelize(`-${ filename }`);

    function toImport() {
      return `import ${ name } from '@/components/${ dir }/${ filename }';`;
    }

    return {
      file,
      filename,
      dir,
      name,

      toImport,
    };
  });

  if (components.length) {
    await fs.ensureFile(dist);
    await fs.writeFile(dist, `
${ warning }
${ components.map(comp => comp.toImport()).join('\n') }

export {
  ${ components.map(comp => `${ comp.name },`).join('\n  ') }
};
`.trimLeft());
  }

  console.log(`${ dir.padEnd(25, ' ') } \t ${ components.length } components`);

  count += components.length;

  return components;
}

const camelizeRE = /-(\w)/g;
const camelize = (str) => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
};