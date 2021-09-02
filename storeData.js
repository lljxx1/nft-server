const AWS = require('aws-sdk');
const axios = require('axios')
const collections = require('./collections')

//AWS.config.region = process.env.REGION
const ddb =  new AWS.DynamoDB.DocumentClient();
const TableName = "prod-table";

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function timestamp(){
    return Math.round(Date.now()/1000)
}

async function getNFTDataAndStore() {
    while (true) {
        for (const collection of collections) {
            const url = `https://api.opensea.io/api/v1/asset/${collection.contract}/${collection.item}/`
            const data = await axios.get(url)
            const { one_day_volume, num_owners, floor_price, total_volume } = data.data.collection.stats
            await ddb.putItem({
                TableName,
                'Item': {
                    PK: `nfts#${collection.id}`,
                    SK: timestamp(),
                    dailyVolume: one_day_volume,
                    owners: num_owners,
                    floor: floor_price,
                    totalVolume: total_volume
                },
            }).promise();
            await sleep(30)
        }
        await sleep(30*60)
    }
}

module.exports = {
    getNFTDataAndStore
}