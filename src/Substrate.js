import CryptoJS from 'crypto-js';
import _ from 'lodash';


/**
 * Abstract StorageStrategy interface
 */
export class StorageStrategy {
    constructor(config) {
      if (this.constructor === StorageStrategy) {
        throw new Error("Abstract classes can't be instantiated.");
      }
    }
  
    async createItem(params) { throw new Error("Method 'createItem()' must be implemented."); }
    async removeItem(params) { throw new Error("Method 'removeItem()' must be implemented."); }
    async getItem(params) { throw new Error("Method 'getItem()' must be implemented."); }
    async getItems(params) { throw new Error("Method 'getItems()' must be implemented."); }
    async addItemData(params) { throw new Error("Method 'addItemData()' must be implemented."); }
    async getItemData(params) { throw new Error("Method 'getItemData()' must be implemented."); }
    async removeItemData(params) { throw new Error("Method 'removeItemData()' must be implemented."); }
    async updateItemMetadata(params) { throw new Error("Method 'updateItemMetadata()' must be implemented."); }
    async parseItem(item) { throw new Error("Method 'parseItem()' must be implemented."); }
    async parseItemData(item) { throw new Error("Method 'parseItemData()' must be implemented."); }
}

/**
 * The Substrate class provides an interface for interacting with various storage systems.
 * It allows for creating, storing, and resolving items using different storage strategies.
 * 
 * Key functionalities include:
 * - Creating a unique item and storing it using the selected storage strategy.
 * - Resolving item hashes using public and private gateways.
 * 
 * The class requires a client identifier and a storage strategy for initialization.
 * 
 * Example usage:
 * 
 * const substrate = new Substrate({
 *   client: 'myClient',
 *   storageStrategy: new PinataStrategy({
 *     pinataKey: 'yourPinataApiKey',
 *     pinataSecret: 'yourPinataApiSecret'
 *   }),
 *   publicGateway: 'https://gateway.pinata.cloud/ipfs',
 *   privateGateway: 'https://private-gateway.pinata.cloud/ipfs'
 * });
 * 
 * const itemHash = await substrate.createItem({ type: 'track', owner: 'user123' });
 * console.log('Created item with hash:', itemHash);
 */

export class Substrate {
    /**
     * Constructor for the Substrate class.
     * @param {Object} params - The parameters for initializing the Substrate instance.
     * @param {string} params.client - A unique identifier for the client.
     * @param {Object} params.storageStrategy - The storage strategy to use.
     * @param {string} params.publicGateway - The public gateway URL.
     * @param {string} params.privateGateway - The private gateway URL.
     * @throws {Error} If any required parameter is missing.
     */
    constructor({
        client,
        storageStrategy,
        publicGateway,
        privateGateway
    }) {
        if (!client) {
            throw new Error('Client identifier is required');
        }

        if (!storageStrategy) {
            throw new Error('Storage strategy is required');
        }

        this.storageStrategy = storageStrategy;
        this.publicGateway = publicGateway;
        this.privateGateway = privateGateway;
        this.client = client;

        this.storageStrategy.substrate = this;

    }

    // Helpers

    /**
     * Generates a secure, unique identifier for the item.
     * @param {string} type - The type of the item.
     * @returns {string} - The generated unique identifier.
     */
    generateSecureUniqueId(type) {
        const time = new Date().getTime();
        const randomBytes = CryptoJS.lib.WordArray.random(16); // Generate 16 random bytes
        return CryptoJS.SHA256(`${time}${randomBytes}${type}`).toString(CryptoJS.enc.Hex);
    }

    parseType(type) {
        if (!type || typeof type !== 'string')
            throw new Error('Type is required and must be a string');

        // Check that type is only alphanumeric and _
        if (!type.match(/^[a-zA-Z0-9_]+$/))
            throw new Error('Type contains invalid characters - please only use alphanumeric characters and _');

        return type.toLowerCase();
    }

    /**
     * Cleans the CID by removing the 'ipfs://' prefix if present.
     * @param {string} cid - The CID to clean.
     * @returns {string} - The cleaned CID.
     */
    cleanCID(cid) {
        return cid.match(/^ipfs:\/\//) ? cid.replace(/^ipfs:\/\//, '') : cid;
    }

    // Core functions

    /**
     * Creates a unique item using the storage strategy.
     * @param {Object} params - The parameters for creating the item.
     * @param {string} params.type - The type of the item.
     * @param {string} params.owner - The owner of the item.
     * @returns {Promise<string>} - The hash of the created item.
     */
    async createItem(params) {
        return this.storageStrategy.createItem(params);
    }

    /**
     * Removes an item and associated data using the storage strategy.
     * @param {Object} params - The parameters for removing the item.
     * @param {string} params.itemHash - The hash of the item to remove.
     * @param {Array} params.dataTypes - The types of data to remove.
     * @returns {Promise<void>} - A promise that resolves when the item and all data are removed.
     */
    async removeItem(params) {
        return this.storageStrategy.removeItem(params);
    }

    /**
     * Retrieves an item using the storage strategy.
     * @param {Object} params - The parameters for retrieving the item.
     * @param {string} params.itemHash - The hash of the item to retrieve.
     * @param {string} [params.type] - The type of the item to retrieve.
     * @returns {Promise<Object>} - The item object if found, otherwise null.
     */
    async getItem(params) {
        return this.storageStrategy.getItem(params);
    }

    /**
     * Retrieves all items associated with the client using the storage strategy.
     * @param {Object} params - The parameters for retrieving the items.
     * @param {string} params.type - The type of the items to retrieve.
     * @param {number} params.page - The page number for pagination.
     * @param {number} params.limit - The number of items to retrieve per page.
     * @param {string} params.owner - The owner of the items.
     * @param {string} params.search - The search query for the items.
     * @returns {Promise<Object>} - The items if found, otherwise null.
     */
    async getItems(params) {
        return this.storageStrategy.getItems(params);
    }

    /**
     * Adds data to an existing item using the storage strategy.
     * @param {Object} params - The parameters for adding data to the item.
     * @param {string} params.itemHash - The hash of the item to update.
     * @param {string} params.type - The type of the data to add.
     * @param {Object} params.data - The data to add to the item.
     * @param {boolean} params.keep - Whether to keep previous data or not.
     * @param {Object} params.keyvalues - The key-value pairs to add to the metadata.
     * @param {string} params.search - The search query for the item.
     * @returns {Promise<Object>} - The response from the storage strategy.
     */
    async addItemData(params) {
        return this.storageStrategy.addItemData(params);
    }

    /**
     * Retrieves data associated with an item using the storage strategy.
     * @param {Object} params - The parameters for retrieving the item data.
     * @param {string} params.itemHash - The hash of the item.
     * @param {string} params.type - The type of the data to retrieve.
     * @param {number} params.page - The page number for pagination.
     * @param {number} params.limit - The number of items to retrieve per page.
     * @param {boolean} params.resolve - Whether to resolve the item hash to the item data.
     * @returns {Promise<Object>} - The item data if found, otherwise null.
     */
    async getItemData(params) {
        return this.storageStrategy.getItemData(params);
    }

    /**
     * Removes data associated with an item using the storage strategy.
     * @param {Object} params - The parameters for removing the item data.
     * @param {string} params.itemHash - The hash of the item.
     * @param {string} params.type - The type of the data to remove.
     * @returns {Promise<Array>} - The list of removed data hashes.
     */
    async removeItemData(params) {
        return this.storageStrategy.removeItemData(params);
    }

    /**
     * Updates the metadata of an existing item using the storage strategy.
     * @param {Object} params - The parameters for updating the item metadata.
     * @param {string} params.itemHash - The hash of the item to update.
     * @param {Object} params.keyvalues - The key-value pairs to update in the metadata.
     * @param {boolean} params.overwrite - Whether to overwrite existing metadata.
     * @returns {Promise<Object>} - The updated metadata object.
     */
    async updateItemMetadata(params) {
        return this.storageStrategy.updateItemMetadata(params);
    }

    /**
     * Resolves a CID to the corresponding hash using the public gateway.
     * @param {string} cid - The CID to resolve.
     * @returns {Promise<Response>} - A promise that resolves to the response from the public gateway.
     */
    async resolve(cid) {
        return fetch(this.publicGateway.replace('{cid}', this.cleanCID(cid)));
    }

    /**
     * Resolves a CID to the corresponding hash using the private gateway.
     * @param {string} cid - The CID to resolve.
     * @returns {Promise<Response>} - A promise that resolves to the response from the private gateway.
     */
    async privateResolve(cid) {
        return fetch(this.privateGateway.replace('{cid}', this.cleanCID(cid)));
    }

    /**
     * Indexes the item by adding the item data using the storage strategy.
     * @param {Object} params - The parameters for indexing the item.
     * @param {string} params.itemHash - The hash of the item to index.
     * @param {Array} params.dataTypes - The types of data to index.
     * @param {string} params.search - The search query for the item.
     * @returns {Promise<Object>} - The hash of the indexed item.
     */
    async indexItem(params) {
        return this.storageStrategy.indexItem(params)
    }

}