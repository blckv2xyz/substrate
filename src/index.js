global._babelPolyfill = false;
import CryptoJS from 'crypto-js';
import pinataSDK from '@pinata/sdk';
import _ from 'lodash';

class Substrate {

    constructor({
        client, // Should be a resolvable domain name, unique id, or other type of identifier that can be used to locate the publishing client
        pinataKey, // The Pinata API key
        pinataSecret, // The Pinata API secret
        publicGateway, // A public gateway URL used for resolving IPFS hashes
        privateGateway // A private gateway URL used for resolving IPFS hashes server-side etc.
    }) {

        if(!client){
            throw new Error('Client identifier is required');
        }

        if(!pinataKey || !pinataSecret) {
            throw new Error('Pinata key and secret are required');
        }

        this.pinata = new pinataSDK(pinataKey, pinataSecret);
        this.publicGateway = publicGateway;
        this.privateGateway = privateGateway;
        this.client = client;

    }

    // Creates a unique id and stores the item in the pinata cloud, return item hash
    async createItem({type = 'generic', owner = null}) {

        // Generate a more secure unique ID
        const uniqueItemId = this.generateSecureUniqueId(type);
        
        // Create metadata for the item
        const metadata = {
            name: uniqueItemId,
            keyvalues: {
                __is_item: 'true',
                type,
                created: new Date().getTime(),
                owner,
                client: this.client
            }
        }

        // Pin the item to the pinata cloud
        const response = await this.pinata.pinJSONToIPFS({
            id: uniqueItemId,
            type,
            created: new Date().getTime(),
            creator: owner,
            client: this.client
        }, {pinataMetadata: metadata});

        // Return the ipfs hash
        return response.IpfsHash;
    }

    async updateItemMetadata({itemHash, keyvalues, overwrite = false}) {

        const item = await this.getItem({itemHash});

        const metadata = item.metadata;

        if(!overwrite) {
            keyvalues = {...metadata.keyvalues, ...keyvalues};
        }

        return this.pinata.hashMetadata(itemHash, {
            keyvalues
        });
    }

    generateSecureUniqueId(type) {
        const time = new Date().getTime();
        const randomBytes = CryptoJS.lib.WordArray.random(16); // Generate 16 random bytes
        return CryptoJS.SHA256(`${time}${randomBytes}${type}`).toString(CryptoJS.enc.Hex);
    }

    async addItemData({itemHash, type, data, unique = true, keyvalues = {}, search = null}) {
        
        const time = new Date().getTime();

        // Get the item
        const item = await this.getItem({itemHash});

        if(!item){
            throw new Error('Item not found');
        }

        // Get the item type
        const itemType = item.metadata.keyvalues.type;

        keyvalues = {
            ...keyvalues,
            type,
            itemHash,
            created: time,
            client: this.client
        }
        
        if(search){
            keyvalues.search = search;
        }

        const pinataOptions = {
            pinataMetadata: {
                name: itemHash+'/'+type,
                keyvalues: keyvalues
            }
        }

        if(unique){
            await this.removeItemData({itemHash, type});
        }

        // Check if the data is a string or an object
        if(_.isPlainObject(data)){
            data.dataType = type;
            data.itemType = itemType;
            data.itemHash = itemHash;
            data.created = time;
            data.client = this.client;
            return this.pinata.pinJSONToIPFS(data, pinataOptions);
        }
        else {
            throw new Error('Data must be an object');
        }

    }

    async getItem({itemHash, type, owner = null}) {

        if(!itemHash)
            throw new Error('itemHash is required in getItem');

        const keyvalues = {
            client: {
                value: this.client,
                op: 'eq'
            }
        }

        if(type) {
            keyvalues.type = {
                value: type,
                op: 'eq'
            }
        }

        if(owner) {
            keyvalues.owner = {
                value: owner,
                op: 'eq'
            }
        }

        const {rows} = await this.pinata.pinList({
            hashContains: itemHash,
            status: 'pinned',
            metadata: {
                keyvalues: keyvalues
            }
        });

        if(rows.length > 0) {
            return rows[0];
        }

        return null;

    }

    async getItemByMetadata({resolve = true, ...keyvalues}) {


        // Go through each keyvalue and convert to pinata format
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

        const {rows} = await this.pinata.pinList({
            status: 'pinned',
            metadata: {
                keyvalues
            }
        });

        if(rows.length > 0) {
            if(resolve) {
                const resolved = await this.resolve(rows[0].ipfs_pin_hash).then(res => res.json());
                resolved.itemHash = rows[0].ipfs_pin_hash;
                return resolved;
            }
            else {
                return rows[0];
            }
        }
        else {
            return null;
        }
        
    }

    async getItemDataByMetadata({metadata, resolve = false}) {

        const {rows} = await this.pinata.pinList({
            status: 'pinned',
            metadata: metadata
        });

        if(resolve) {
            let resolved = 'Unable to resolve data';
            if(rows?.length > 0)
                resolved = await this.resolve(rows[0].ipfs_pin_hash).then(res => res.json());
            return resolved;
        }
        else {
            return rows;
        }

    }


    async getItemData({itemHash, type = null, page = 1, limit = 10, resolve = false}) {

        if(page < 1) {
            page = 1;
        }

        if(limit < 1) {
            limit = 10;
        }

        const keyvalues = {
            client: {
                value: this.client,
                op: 'eq'
            },
            itemHash: {
                value: itemHash,
                op: 'eq'
            }
        }

        if(type && typeof type == 'string') {
            keyvalues.type = {
                value: type,
                op: 'eq'
            }
        }

        const data = await this.pinata.pinList({
            status: 'pinned',
            pageLimit: limit,
            pageOffset: (page - 1) * limit,
            metadata: {
                keyvalues
            }
        });
        

        if(resolve) {
            let resolved = 'Unable to resolve data';
            if(data?.rows?.length > 0)
                resolved = await this.resolve(data.rows[0].ipfs_pin_hash).then(res => res.json());
            return resolved;
        }
        else {
            return data;
        }
    }


    async getItems({type, page = 1, limit = 10, owner = null, s = null}) {

        if(page < 1) {
            page = 1;
        }

        if(limit < 1) {
            limit = 10;
        }

        const keyvalues = {
            client: {
                value: this.client,
                op: 'eq'
            },
            type: {
                value: type,
                op: 'eq'
            }
        }

        if(owner) {
            keyvalues.owner = {
                value: owner,
                op: 'eq'
            }
        }

        return this.pinata.pinList({
            status: 'pinned',
            pageLimit: limit,
            pageOffset: (page - 1) * limit,
            metadata: {
                keyvalues
            }
        });
    }


    async removeItemData({itemHash, type}) {
        const data = await this.getItemData({itemHash, type});
        if(data.rows) {
            const unpinned = [];
            const promises = [];
            
            for(const item of data.rows) {
                promises.push(await this.pinata.unpin(item.ipfs_pin_hash));
                unpinned.push(item.ipfs_pin_hash);
            }
            
            await Promise.all(promises);
            return unpinned;
        }
        else {
            return null;
        }
    }

    async removeAllItemData({itemHash}) {
        const data = await this.getItemData({itemHash});
        for(const item of data.rows) {
            await this.pinata.unpin(item.ipfs_pin_hash);
        }
    }

    // Delete item and all associated data
    async removeItem({itemHash, dataTypes = null}) {
        await this.pinata.unpin(itemHash);
        if(!dataTypes) {
            return this.removeAllItemData({itemHash});
        }
        else {
            for(const type of dataTypes) {
                await this.removeItemData({itemHash, type});
            }    
        }
    }

    cleanCID(cid){
        return cid.match(/^ipfs:\/\//) ? cid.replace(/^ipfs:\/\//, '') : cid;
    }

    async resolve(cid) {
        return fetch(this.publicGateway.replace('{cid}', this.cleanCID(cid)));
    }

    async privateResolve(cid) {
        return fetch(this.privateGateway.replace('{cid}', this.cleanCID(cid)));
    }

    async indexItem({itemHash, dataTypes, search = null}) {

        const index = {};

        const promises = [];
        for(const type of dataTypes) {
            const func = async () => {
                const data = await this.getItemData({itemHash, type, limit: 1});
                if(data.rows.length > 0) {
                    index[type] = data.rows[0].ipfs_pin_hash;
                }
            }
            promises.push(func());
        }

        await Promise.all(promises);
            
        const indexData = await this.addItemData({itemHash, type: 'index', data: index, search});

        return {indexHash: indexData.IpfsHash};
    } 

    
}


export default Substrate;