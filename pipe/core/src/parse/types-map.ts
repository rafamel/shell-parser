import assert from 'assert';
import maps from './map.json';
import { ITypeMap, ITypeDef } from '~/types';
import getName from './get-name';
import { REGEX } from '~/constants';
import types from './raw';

let run = false;
let typesMap: ITypeMap = {};

export const queue: string[] = [];

function generate(): void {
  if (!types) throw Error(`Types haven't been provided`);
  run = true;
  typesMap = {
    ...Object.keys(maps.scalars).reduce(
      (acc: ITypeMap, name: string): ITypeMap => {
        acc[name] = {
          was: name,
          is: getName(name, 'scalar'),
          kind: 'scalar'
        };
        return acc;
      },
      {}
    ),
    ...Object.keys(types).reduce((acc: ITypeMap, name: string): ITypeMap => {
      const obj = types[name];

      if (obj.type && obj.type.kind === 'struct') {
        acc[name] = {
          was: name,
          is: getName(name, 'struct'),
          kind: 'struct'
        };
      } else if (obj.type && obj.type.kind === 'interface') {
        acc[name] = {
          was: name,
          is: getName(name, 'interface'),
          kind: 'interface'
        };
      } else if (obj.enumvalues) {
        acc[name] = {
          was: name,
          is: getName(name, 'enum'),
          kind: 'enum'
        };
      } else {
        // eslint-disable-next-line no-console
        console.error(name, obj);
        throw Error('Type could not be identified for a kind');
      }
      return acc;
    }, {})
  };
}

export default {
  get(name: string): ITypeDef {
    if (!run) generate();

    assert(typeof name === 'string');

    name = name.replace(REGEX, '');
    assert(typesMap.hasOwnProperty(name));

    const def = typesMap[name];
    if (def.kind !== 'scalar') queue.push(def.was);

    return def;
  },
  all(): ITypeMap {
    if (!run) generate();
    return typesMap;
  }
};
