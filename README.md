![Substrate](substrate.jpg)

# Substrate

Substrate is a flexible wrapper for IPFS-based storage services, providing a unified interface for item management, data storage, manipulation, and retrieval. It leverages IPFS as the underlying decentralized data layer while capable of utilizing various storage strategies as the relationship and permission layer. The vision is to enable flexible options for systems that need open data storage but still need permissioned access control.

The package is not yet ready for production use yet, but any and all contributions are welcome to help get it there!

## Usage

```javascript
import { Substrate } from './src/Substrate';
import { PinataStrategy } from './src/strategies/PinataStrategy';

const pinataStrategy = new PinataStrategy({
  pinataKey: 'your-pinata-key',
  pinataSecret: 'your-pinata-secret'
});

const substrate = new Substrate({
  client: 'your-client-identifier',
  storageStrategy: pinataStrategy,
  publicGateway: 'https://gateway.pinata.cloud/ipfs/{cid}',
  privateGateway: 'https://api.pinata.cloud/ipfs/{cid}'
});
```

## API Reference

### API Overview

Substrate provides a simple and intuitive API for interacting with various storage services. The main functionalities include:

1. Creating and managing items in the chosen storage system
2. Adding and retrieving data associated with items
3. Searching and querying items and their data
4. Managing metadata and environment-specific information

The following sections detail the key methods available in the Substrate API.

### Constructor

#### Parameters

- `options` (Object):
  - `client` (string): A resolvable domain name, unique id, or other identifier for the publishing client.
  - `storageStrategy` (StorageStrategy): An instance of a class implementing the StorageStrategy interface.
  - `publicGateway` (string): A public gateway URL used for resolving content hashes.
  - `privateGateway` (string): A private gateway URL used for resolving content hashes server-side.

### `createItem(options)`

Creates a new unique immutable item in the storage system and returns the content hash.

#### Example

```javascript
const itemHash = await substrate.createItem({
  type: 'image',
  owner: 'user123'
});
```

#### Parameters

- `options` (Object):
  - `type` (string, optional): The type of the item. Defaults to 'generic'.
  - `owner` (string, optional): The owner of the item.

#### Returns

Promise<string>: A promise that resolves to the content hash of the created item.

### `addItemData(options)`

Adds data to an existing item.

#### Example

```javascript
const response = await substrate.addItemData({
  itemHash: 'QmHashOfItem',
  type: 'image_data',
  data: {
    title: 'My Image',
    description: 'This is a sample image',
    url: 'ipfs://QmHashOfImage'
  }
});
```

#### Parameters

- `options` (Object):
  - `itemHash` (string): The content hash of the item.
  - `type` (string): The type of data being added.
  - `data` (Object): The data to be added.
  - `keep` (boolean, optional): Whether to keep previous data or not. Defaults to false.
  - `keyvalues` (Object, optional): Additional key-value pairs to add to the metadata.
  - `search` (string, optional): A search query for the item.

#### Returns

Promise<Object>: A promise that resolves to the storage service response object.

### `getItem(options)`

Retrieves an item from the storage system.

#### Example

```javascript
const item = await substrate.getItem({
  itemHash: 'QmHashOfItem'
});
```

#### Parameters

- `options` (Object):
  - `itemHash` (string): The content hash of the item.
  - `type` (string, optional): The type of the item.
  - `resolve` (boolean, optional): If true, resolves and returns the actual item data. Defaults to true.

#### Returns

Promise<Object|null>: A promise that resolves to the item object if found, or null if not found.

### `getItemData(options)`

Retrieves data associated with an item.

#### Example

```javascript
const data = await substrate.getItemData({
  itemHash: 'QmHashOfItem',
  type: 'image_data'
});
```

#### Parameters

- `options` (Object):
  - `itemHash` (string): The content hash of the item.
  - `type` (string): The type of data to retrieve.
  - `resolve` (boolean, optional): If true, resolves and returns the actual data. Defaults to true.

#### Returns

Promise<Object>: A promise that resolves to the data object or the resolved data if `resolve` is true.

### `getItems(options)`

Retrieves multiple items based on specified criteria.

#### Example

```javascript
const items = await substrate.getItems({
  type: 'image',
  page: 1,
  limit: 10,
  keyvalues: {
    category: 'landscape'
  },
  owner: 'user123'
});
```

#### Parameters

- `options` (Object):
  - `type` (string): The type of items to retrieve.
  - `page` (number, optional): The page number for pagination. Defaults to 1.
  - `limit` (number, optional): The number of items per page. Defaults to 10.
  - `keyvalues` (Object, optional): Key-value pairs to filter the items.
  - `owner` (string, optional): The owner of the items.

#### Returns

Promise<Array>: A promise that resolves to an array containing the list of items.

### `removeItemData(options)`

Removes specific data associated with an item.

#### Example

```javascript
await substrate.removeItemData({
  itemHash: 'QmHashOfItem',
  type: 'image_data'
});
```

#### Parameters

- `options` (Object):
  - `itemHash` (string): The content hash of the item.
  - `type` (string): The type of data to remove.

#### Returns

Promise<boolean>: A promise that resolves to true if data was removed, false otherwise.

### `removeItem(options)`

Removes an item and selected associated data.

#### Example

```javascript
await substrate.removeItem({
  itemHash: 'QmHashOfItem',
  dataTypes: ['image', 'metadata']
});
```

#### Parameters

- `options` (Object):
  - `itemHash` (string): The content hash of the item to remove.
  - `dataTypes` (Array<string>, optional): An array of data types to remove.

#### Returns

Promise<void>

### `updateItemMetadata(options)`

Updates the metadata of an existing item.

#### Example

```javascript
await substrate.updateItemMetadata({
  itemHash: 'QmHashOfItem',
  keyvalues: {
    title: 'Updated Title',
    tags: ['new', 'tags']
  },
  overwrite: false
});
```

#### Parameters

- `options` (Object):
  - `itemHash` (string): The content hash of the item to update.
  - `keyvalues` (Object): The key-value pairs to update in the metadata.
  - `overwrite` (boolean, optional): If true, overwrites existing metadata. Defaults to false.

#### Returns

Promise<Object>: A promise that resolves to the updated metadata object.

### `indexItem(options)`

Creates an index for an item with specified data types.

#### Example

```javascript
const index = await substrate.indexItem({
  itemHash: 'QmHashOfItem',
  dataTypes: ['image', 'video'],
  search: 'searchable terms'
});
```

#### Parameters

- `options` (Object):
  - `itemHash` (string): The content hash of the item to index.
  - `dataTypes` (Array<string>): An array of data types to include in the index.
  - `search` (string, optional): A search term to associate with the index.

#### Returns

Promise<Object>: A promise that resolves to an object containing the indexed data.
