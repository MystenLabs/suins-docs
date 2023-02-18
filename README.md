# SuiNS

SuiNS is a distributed naming system based on the Sui blockchain built with a set of smart contracts.

## Architecture

```mermaid
flowchart TB
 name1-->resolver1
 name2-->resolver1
 reverse-->resolver2

 subgraph Resolvers
  resolver1
  resolver2
 end
 subgraph SuiNS Registry
  name1{{a-name.sui}}
  name2{{another-name.sui}}
  reverse{{1234....addr.reverse}}
 end
```

## Lookup for name

```mermaid
sequenceDiagram
Alice ->> SuiNS Registry: resolver('a-name.sui')?
Note right of SuiNS Registry: find the resolver value<br/> of coresponding name in the<br/> registry shared object.

SuiNS Registry ->> Alice: 0x1234...
Alice ->> Resolver@0x1234...: addr('a-name.sui')?
Note right of Resolver@0x1234...: resolver is also a shared object.
Note  over Alice,Resolver@0x1234...: find the address value<br/> of coresponding name in the<br/> resolver shared object.
Resolver@0x1234... ->> Alice: 0xf0f0...
```

## Lookup for default name

```mermaid
sequenceDiagram
Alice ->> SuiNS Registry: resolver('f0f0....addr.reverse')?
Note  over Alice,SuiNS Registry: address is a special name<br/> served for default name lookup.
Note right of SuiNS Registry: find the resolver value<br/> of coresponding name in the<br/> registry shared object.

SuiNS Registry ->> Alice: 0x9876...
Alice ->> Resolver@0x9876...: name('f0f0....addr.reverse')?
Note  over Alice,Resolver@0x9876...: find the name value of coresponding address <br/> in the resolver shared object.
Resolver@0x9876... ->> Alice: a-name.sui
Note  over Alice,Resolver@0x9876...: double check if a-name.sui is default name of f0f0... <br> by looking up the registry again to see if f0f0... own the name.
Alice ->> SuiNS Registry: does f0f0.... own a-name.sui?
```

## Contracts

On the contract publishing event, a `AdminCap` NFT is mint to the deployer address and transferable to anyone - only address holding this NFT can call admin features.

### Current contracts/objects:

#### Devnet
- Package address: [0x7a169bd44a9a6c20a39d57068bc3eacaad9f0c9f](https://explorer.devnet.sui.io/objects/0x7a169bd44a9a6c20a39d57068bc3eacaad9f0c9f)
- Registry object: [0x7ba7c4a4c8d9ef2990f0e2efbfe0e3545b979119](https://explorer.devnet.sui.io/objects/0x7ba7c4a4c8d9ef2990f0e2efbfe0e3545b979119)
- Base resolver object: [0xa5464baf7d8c68b368f49840be0c1cd1e84b2d2a](https://explorer.devnet.sui.io/objects/0xa5464baf7d8c68b368f49840be0c1cd1e84b2d2a)
- Configuration object: [0x98e31668448e2d036169fb973af3f14debb6cd23](https://explorer.devnet.sui.io/objects/0x98e31668448e2d036169fb973af3f14debb6cd23)

#### Testnet
- Package address: [0xa050fe335117c5ebe1ad8b41b50de6a634ff4f08](https://explorer.sui.io/object/0xa050fe335117c5ebe1ad8b41b50de6a634ff4f08?network=testnet)
- Registry object: [0xb4f8d9937c6a0b1682d5737066b9f3b514cc9e0b](https://explorer.sui.io/object/0xb4f8d9937c6a0b1682d5737066b9f3b514cc9e0b?network=testnet)
- Base resolver object: [0x0e6d059fa557226f4fbe78292b1c5496bba27db2](https://explorer.sui.io/object/0x0e6d059fa557226f4fbe78292b1c5496bba27db2?network=testnet)
- Configuration object: [0x69c615e6e44a58485540aab93079a852e2e6d314](https://explorer.sui.io/object/0x69c615e6e44a58485540aab93079a852e2e6d314?network=testnet)

#### Registry

A single source of truth maintaining a list of names records the owner, resolver, and TTL for each, and allows the owner of a domain to make changes to that data.

All SuiNS lookups start by querying the registry.

More details: [Registry Contract](./contracts/registry.md)

#### Registrar

Contains the core functionality of the permanent registrar.

More details: [Registrar Contract](./contracts/registrar.md)

#### Controller

Built on top of the registrar contract containing logics for name validation, prevent frontrunning. This is the entry point for registering a new name. The contract also maintains funds collected from name purchases, only address holds the SuiNS Admin NFT can withdraw the funds.

More details: [Controller Contract](./contracts/controller.md).

#### Resolver

Implements a general-purpose SuiNS resolver that is suitable for standard SuiNS use-cases (allowing user to set data for the name, e.g: address, name, etc).

More details: [Resolver Contract](./contracts/resolver.md).

## Interact with contract

To buy a name, it requires 2 smart contract calls:

- check sample [commitment.cjs](./sample/commitment.cjs).

```bash

PACKAGE_ADDR=
SUI_REGISTRAR=
​
BASE_CONTROLLER=
REGISTRY=
// first value of: `sui client addresses`
OWNER_ADDR=

SECRET='random string'
DOMAIN_NAME='a-name'
SUI_DOMAIN_NAME="$DOMAIN_NAME.sui"

COIN_ADDRESS=

// generate commitment
SUI_COMMITMENT=$(node ./sample/commitment.cjs $SUI_DOMAIN_NAME $OWNER_ADDR $SECRET);

// first transaction: make commitment to buy a name
sui client call --package $PACKAGE_ADDR --module base_controller \
    --function make_commitment_and_commit \
    --args $BASE_CONTROLLER $SUI_COMMITMENT --gas-budget 20000

// final transaction: actual request to buy the name
sui client call --package $PACKAGE_ADDR --module base_controller \
    --function register \
    --args $BASE_CONTROLLER $SUI_REGISTRAR $REGISTRY $CONFIGURATION $DOMAIN_NAME \
    $OWNER_ADDR 365 $SECRET $COIN_ADDRESS --gas-budget 20000
```

For details full open functions of our smart contracts, let's explore in each contract document itself.

## Resolve name and address

- check sample [resolvers.js](./sample/resolvers.js).

---
