import { ITypeDefMap, TTypeDef, IKindBox } from '~/types';
import collection from './collection';
import imports from './imports';
import renderEnum from './enum';
import renderInterface from './interface';
import { declaration, implementation } from './struct';
import fromJSON from './from-json';
import prototypes from './prototypes';
import { path } from '~/pkg';

export function kindBox(arr: TTypeDef[]): IKindBox {
  return arr.reduce(
    (acc: IKindBox, item) => {
      switch (item.kind) {
        case 'enum':
          acc.enum.push(item);
          break;
        case 'interface':
          acc.interface.push(item);
          break;
        case 'struct':
          acc.struct.push(item);
          break;
        default:
          // eslint-disable-next-line no-console
          console.error(item);
          throw Error('Kind could not be identified');
      }
      return acc;
    },
    { enum: [], interface: [], struct: [] }
  );
}

export default function assemble(
  types: ITypeDefMap
): { [key: string]: string } {
  const boxed = kindBox(Object.values(types));
  const all = {
    enum: collection(boxed.enum, renderEnum),
    interface: collection(boxed.interface, renderInterface),
    implementation: collection(boxed.struct, implementation),
    declaration: collection(boxed.struct, declaration)
  };

  return {
    'enum.ts': imports(all.enum.dependencies, 'enum') + all.enum.render,
    'interface.ts':
      '/* eslint-disable import/named */\n' +
      imports(all.interface.dependencies, 'interface') +
      all.interface.render,
    'struct.js':
      '/* eslint-disable import/no-unresolved */\n' +
      imports(all.implementation.dependencies, [
        'struct',
        'interface',
        'enum'
      ]) +
      all.implementation.render,
    'struct.d.ts':
      imports(all.declaration.dependencies, 'struct') + all.declaration.render,
    'prototypes.ts': prototypes(boxed.struct),
    'from-json.ts': fromJSON(boxed.struct),
    'pkg.ts': `
      import sh from '#/sh';
      
      export const pkg = sh.packages['${path}'];
    `,
    'types.ts': `
      export const interfaces: { [key:string]: string[] } = ${JSON.stringify(
        Object.values(types).reduce((acc: any, item) => {
          if (item.kind === 'interface') {
            acc[item.is] = item.implementedBy;
          }
          return acc;
        }, {}),
        null,
        2
      )};
    `
  };
}
