import get from 'lodash/get';
import { JsonRpcProvider } from '@mysten/sui.js';

const PACKAGE_ADDRESS = '0xf44f6b29c763a496bb29d560b637aee69f90e8ed'; // Replace this with the current package address
const REGISTRY_ADDRESS = '0x866a120cf14fc500a448b9461f53592477ae4019'; // Replace this with the current registry object address
const SENDER = '0x01'; // Replace this with a valid SUI address

const suiProvider = new JsonRpcProvider('https://fullnode.devnet.sui.io/');

const toHexString = (byteArray) =>
  byteArray?.length > 0 ? Array.from(byteArray, (byte) => ('0' + (byte & 0xff).toString(16)).slice(-2)).join('') : '';

const toString = (byteArray) =>
  byteArray?.length > 0 ? new TextDecoder().decode(Buffer.from(byteArray.slice(1)).buffer) : '';

const toFullAddress = (trimmedAddress) => (trimmedAddress ? `0x${trimmedAddress.padStart(40, '0')}` : '');

const getResolver = async (key, sender) => {
  const resolverBytes = get(
    await suiProvider.devInspectTransaction(sender, {
      kind: 'moveCall',
      data: {
        packageObjectId: PACKAGE_ADDRESS,
        module: 'base_registry',
        function: 'get_record_by_key',
        typeArguments: [],
        arguments: [REGISTRY_ADDRESS, key],
      },
    }),
    'results.Ok[0][1].returnValues[1][0]',
  );
  return toFullAddress(toHexString(resolverBytes));
};

export const getName = async (address, sender = SENDER) => {
  const resolver = await getResolver(`${address.slice(2)}.addr.reverse`, sender);
  if (!resolver) return '';

  const name = toString(
    get(
      await suiProvider.devInspectTransaction(sender, {
        kind: 'moveCall',
        data: {
          packageObjectId: PACKAGE_ADDRESS,
          module: 'resolver',
          function: 'name',
          typeArguments: [],
          arguments: [resolver, address],
        },
      }),
      'results.Ok[0][1].returnValues[0][0]',
    ),
  );
  return name;
};

export const getAddress = async (domain, sender = SENDER) => {
  const resolver = await getResolver(domain, sender);
  if (!resolver) return '';

  const addr = get(
    await suiProvider.devInspectTransaction(sender, {
      kind: 'moveCall',
      data: {
        packageObjectId: PACKAGE_ADDRESS,
        module: 'resolver',
        function: 'addr',
        typeArguments: [],
        arguments: [resolver, domain],
      },
    }),
    'results.Ok[0][1].returnValues[0][0]',
  );
  return addr?.every((e) => !e) ? '' : toFullAddress(toHexString(addr));
};
