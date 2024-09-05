![Substrate](substrate.jpg)

# Substrate

Substrate is a wrapper for Pinata IPFS services, providing simplified item management, data storage, and retrieval with environment-specific metadata handling.

## Installation

```bash
npm install @your-package/substrate
```

## Usage

```javascript
import Substrate from '@your-package/substrate';

const substrate = new Substrate({
  client: 'your-client-identifier',
  pinataKey: 'your-pinata-key',
  pinataSecret: 'your-pinata-secret',
  publicGateway: 'https://gateway.pinata.cloud',
  privateGateway: 'https://api.pinata.cloud'
});
```
## API Reference

### API Overview

Substrate provides a simple and intuitive API for interacting with Pinata IPFS services. The main functionalities include:

1. Creating and managing items in the Pinata cloud
2. Adding and retrieving data associated with items
3. Searching and querying items and their data
4. Managing metadata and environment-specific information

The following sections detail the key methods available in the Substrate API.

#### Parameters

- `options` (Object):
  - `client` (string): A resolvable domain name, unique id, or other identifier for the publishing client.
  - `pinataKey` (string): The Pinata API key.
  - `pinataSecret` (string): The Pinata API secret.
  - `publicGateway` (string): A public gateway URL used for resolving IPFS hashes.
  - `privateGateway` (string): A private gateway URL used for resolving IPFS hashes server-side.

### `createItem(options)`

Creates a new unique immutable item in the Pinata cloud and returns the IPFS hash.

#### Example

```javascript
const item = await substrate.createItem({
  type: 'image',
  owner: 'user123'
});
```

#### Parameters

- `options` (Object):
  - `type` (string, optional): The type of the item. Defaults to 'generic'.
  - `owner` (string, optional): The owner of the item.

#### Returns

Promise<string>: A promise that resolves to the IPFS hash of the created item.

### `addItemData(options)`

Adds data to an existing item.

#### Example

```javascript
const data = await substrate.addItemData({
  itemHash: item,
  type: 'image',
  data: {
    url: 'https://example.com/image.jpg'
  },
  unique: true,
  keyvalues: {
    title: 'My Image',
    description: 'This is a sample image'
  },
  search: 'a string providing simple search functionality'
});
```

#### Parameters

- `options` (Object):
  - `itemHash` (string): The IPFS hash of the item.
  - `type` (string): The type of data being added.
  - `data` (Object): The data to be added.
  - `unique` (boolean, optional): If true, removes existing data of the same type before adding. Defaults to true.
  - `keyvalues` (Object, optional): Additional key-value pairs to include in the metadata.
  - `search` (string, optional): A search term to associate with the data.

#### Returns

Promise<Object>: A promise that resolves to the Pinata response object.

### `getItem(options)`

Retrieves an item from Pinata.

#### Example

```javascript
const item = await substrate.getItem({
  itemHash: 'QmHashOfItem'
});
```

#### Parameters

- `options` (Object):
  - `itemHash` (string): The IPFS hash of the item.
  - `type` (string, optional): The type of the item.
  - `owner` (string, optional): The owner of the item.

#### Returns

Promise<Object|null>: A promise that resolves to the item object if found, or null if not found.

### `getItemData(options)`

Retrieves data associated with an item.

#### Example

```javascript
const data = await substrate.getItemData({
  itemHash: 'QmHashOfItem',
  type: 'image'
});
```

#### Parameters

- `options` (Object):
  - `itemHash` (string): The IPFS hash of the item.
  - `type` (string, optional): The type of data to retrieve.
  - `page` (number, optional): The page number for pagination. Defaults to 1.
  - `limit` (number, optional): The number of items per page. Defaults to 10.
  - `resolve` (boolean, optional): If true, resolves and returns the actual data. Defaults to false.

#### Returns

Promise<Object>: A promise that resolves to the data object or the resolved data if `resolve` is true.

### `getItems(options)`

Retrieves multiple items based on specified criteria.

#### Example

```javascript
const items = await substrate.getItems({
  type: 'image',
  page: 1,
  limit: 10
});

#### Parameters

- `options` (Object):
  - `type` (string): The type of items to retrieve.
  - `page` (number, optional): The page number for pagination. Defaults to 1.
  - `limit` (number, optional): The number of items per page. Defaults to 10.
  - `owner` (string, optional): The owner of the items.
  - `s` (string, optional): A search term.

#### Returns

- Promise<Object>: A promise that resolves to an object containing the list of items.

### `removeItemData(options)`

Removes specific data associated with an item.

#### Example

```javascript
await substrate.removeItemData({
  itemHash: 'QmHashOfItem',
  type: 'image'
});
```

#### Parameters

- `options` (Object):
  - `itemHash` (string): The IPFS hash of the item.
  - `type` (string): The type of data to remove.

#### Returns

- Promise<Array|null>: A promise that resolves to an array of unpinned IPFS hashes, or null if no data was found.

### `removeItem(options)`

Removes an item and its associated data.

#### Example

```javascript
await substrate.removeItem({
  itemHash: 'QmHashOfItem'
});
```

#### Parameters

- `options` (Object):
  - `itemHash` (string): The IPFS hash of the item to remove.
  - `dataTypes` (Array<string>, optional): An array of data types to remove. If not provided, all data will be removed.

#### Returns

- Promise<void>

### `indexItem(options)`

Creates an index for an item with specified data types.

#### Example

```javascript
const index = await substrate.indexItem({
  itemHash: 'QmHashOfItem',
  dataTypes: ['image', 'video']
});
```

#### Parameters

- `options` (Object):
  - `itemHash` (string): The IPFS hash of the item to index.
  - `dataTypes` (Array<string>): An array of data types to include in the index.
  - `search` (string, optional): A search term to associate with the index.

#### Returns

- Promise<Object>: A promise that resolves to an object containing the `indexHash`.
