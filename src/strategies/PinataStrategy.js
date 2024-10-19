global._babelPolyfill = false;
import pinataSDK from '@pinata/sdk';
import _ from 'lodash';
import {StorageStrategy} from '../Substrate';

export class PinataStrategy extends StorageStrategy {

    constructor(config) {
        super(config);
        const { pinataKey, pinataSecret } = config;
        if (!pinataKey || !pinataSecret) {
            throw new Error('Pinata key and secret are required');
        }
        this.pinata = new pinataSDK(pinataKey, pinataSecret);
    }

    async createItem({ type = 'generic', owner = null }) {
        const sub_item = `${type}:${this.substrate.generateSecureUniqueId(type)}`;
        
        const sub = {
            sub_item,
            sub_date: new Date().getTime(),
            sub_client: this.substrate.client,
        }

        const metadata = {
            name: sub_item,
            keyvalues: {
                sub_owner: owner,
                ...sub
            }
        }

        const response = await this.pinata.pinJSONToIPFS({
            ...sub
        }, { pinataMetadata: metadata });

        return response.IpfsHash;
    }

    async removeItem({ itemHash, dataTypes = null }) {
        const item = await this.getItem({ itemHash });
        if (!item) {
            throw new Error('Item not found');
        }
        await this.pinata.unpin(itemHash);
        if (dataTypes) {
            const removePromises = dataTypes.map(type => this.removeItemData({ itemHash, type }));
            await Promise.all(removePromises);
        }
    }

    async getItem({ itemHash, type = null, resolve = true }) {
        if (!itemHash) {
            throw new Error('itemHash is required in getItem');
        }

        const args = {
            hashContains: itemHash,
            status: 'pinned',
            metadata: {
                keyvalues: {
                    sub_client: {
                        value: this.substrate.client,
                        op: 'eq'
                    }
                },
            }
        }

        if (type) {
            args.metadata.keyvalues.sub_item = {
                value: `^${type}:`,
                op: 'regexp'
            }
        }

        const response = await this.pinata.pinList(args);

        return response.rows.length > 0 ? (resolve ? this.parseItem(response.rows[0]) : response.rows[0]) : null;

    }

    async getItems({ type = null, page = 1, limit = 10, keyvalues = {}, owner = null }) {
        
        if (page < 1) {
            page = 1;
        }

        if (limit < 1) {
            limit = 10;
        }

        // Go through each keyvalue and convert to pinata format
        if(keyvalues){
            for(const key in keyvalues) {
                const value = keyvalues[key];
                if(value instanceof Object && value.value){
                    keyvalues[key] = {
                        value: value.value,
                        op: value.op || 'eq'
                    }
                }
                else {
                    keyvalues[key] = {
                        value: value,
                        op: 'eq'
                    }
                }
            }
        }


        const _keyvalues = {
            ...keyvalues,
            sub_client: {
                value: this.substrate.client,
                op: 'eq'
            },
            sub_item: {
                value: `^${type}:`,
                op: 'regexp'
            }
        }


        if (owner) {
            _keyvalues.sub_owner = {
                value: owner,
                op: 'eq'
            }
        }

        const args = {
            status: 'pinned',
            pageLimit: limit,
            pageOffset: (page - 1) * limit,
            metadata: {
                keyvalues: _keyvalues
            }
        }

        const response = await this.pinata.pinList(args);
        if(response.rows.length < 1){
            return [];
        }

        const items = await Promise.all(response.rows.map(row => this.parseItem(row)));
        return items;
    }

    async addItemData({ itemHash, type, data, keep = false, keyvalues = {}, search = null }) {
        
        const item = await this.getItem({ itemHash });
        if(!item){
            throw new Error('Item not found');
        }

        const time = new Date().getTime();

        const sub_id = `${itemHash}/${type}`;
        
        const sub = {
            sub_id,
            sub_date: time,
            sub_client: this.substrate.client
        }

        keyvalues = {
            ...keyvalues,
            ...sub
        }
        
        if (search) {
            keyvalues.search = search;
        }

        const pinataOptions = {
            pinataMetadata: {
                name: sub_id,
                keyvalues: keyvalues
            }
        }

        if(!keep){
            await this.removeItemData({ itemHash, type });
        }

        if (_.isPlainObject(data)) {
            data = {
                ...data,
                ...sub
            };
            return this.pinata.pinJSONToIPFS(data, pinataOptions);
        } else {
            throw new Error('Data must be an object');
        }
    }

    async getItemData({ itemHash, type, resolve = true }) {

        const keyvalues = {
            sub_client: {
                value: this.substrate.client,
                op: 'eq'
            },
            sub_id: {
                value: `${itemHash}/${type}`,
                op: 'eq'
            }
        }

        const data = await this.pinata.pinList({
            status: 'pinned',
            metadata: {
                keyvalues: keyvalues
            }
        });

        if(data.rows.length > 0){
            if(resolve)
                return this.parseItemData(data.rows[0]);
            else
                return data.rows[0];
        }
    }

    async removeItemData({ itemHash, type }) {
        const itemData = await this.getItemData({ itemHash, type, resolve: false });
        if(itemData?.ipfs_pin_hash){
            await this.pinata.unpin(itemData.ipfs_pin_hash);
            return true;
        } else {
            return false;
        }
    }

    async updateItemMetadata({ itemHash, keyvalues, overwrite = false }) {
        const item = await this.getItem({ itemHash, resolve: false });

        const metadata = item.metadata;

        if (!overwrite) {
            keyvalues = { ...metadata.keyvalues, ...keyvalues };
        }

        return this.pinata.hashMetadata(itemHash, {
            keyvalues
        });
    }

    // Additional methods that might be useful
    async resolve(cid) {
        // This method might need to be implemented differently or moved to the Substrate class
        // as it depends on the gateway URLs
        throw new Error('Method not implemented in PinataStrategy');
    }

    async privateResolve(cid) {
        // This method might need to be implemented differently or moved to the Substrate class
        // as it depends on the gateway URLs
        throw new Error('Method not implemented in PinataStrategy');
    }

    async parseItem(item) {
        if(item?.metadata?.keyvalues?.sub_item){
            return {
                ...item.metadata.keyvalues,
                sub_hash: item.ipfs_pin_hash,
            }
        }
    }

    async parseItemData(itemData) {
        const parsed = await this.substrate.privateResolve(itemData.ipfs_pin_hash).then(res => res.json());
        return {
            ...parsed,
            sub_hash: itemData.ipfs_pin_hash,
        }
    }

        /**
     * Indexes the item by adding the item data using the storage strategy.
     * @param {Object} params - The parameters for indexing the item.
     * @param {string} params.itemHash - The hash of the item to index.
     * @param {Array} params.dataTypes - The types of data to index.
     * @param {string} params.search - The search query for the item.
     * @returns {Promise<Object>} - The hash of the indexed item.
     */
    async indexItem({ itemHash, dataTypes, search = null }) {
        const index = {};

        const promises = dataTypes.map(async (type) => {
            const data = await this.getItemData({ itemHash, type, resolve: false });
            if (data.ipfs_pin_hash) {
                index[type] = data.ipfs_pin_hash
            }
        });

        await Promise.all(promises);

        const indexData = await this.addItemData({ itemHash, type: 'index', data: index, search });
        const savedIndex = await this.getItemData({ itemHash: indexData.IpfsHash, type: 'index' });
        return savedIndex;
    }

}