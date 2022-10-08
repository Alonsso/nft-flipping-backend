const axios = require('axios');
//const fs = require("fs").promises;
const fs = require('fs');
const { parse } = require("csv-parse");
const listings = require('../listings_v2.json');
const undervalues = require('../undervalued.json');
const under_r = require('../undervalued_r.json');
//const listings_v2 = require('../listings_v2.json');

const repair = async () => {
    let cnt = 0;
    for (const listing of listings) {
        listing.token_id = cnt.toString();
        console.log(listing.token_id);
        cnt++;
    }
    let json_data = JSON.stringify(listings);
    fs.writeFile('listings_r.json', json_data, 'utf-8', () => {
        console.log("LISTINGS REPAIRED COMPLETE");
    })
}

const repairUnder = async () => {
    let cnt = 0;
    for (const land of undervalues) {
        land.token_id = cnt.toString();
        console.log(undervalues.token_id);
        cnt++;
    }
    let json_data = JSON.stringify(undervalues);
    fs.writeFile('undervalued_r.json', json_data, 'utf-8', () => {
        console.log("LISTINGS REPAIRED COMPLETE");
    })
}

const getIt = async () => {
    let url_stats_2 = 'https://api.opensea.io/api/v1/collection/decentraland';
    const response_stats = await axios.get(url_stats_2);
    let floor_price = response_stats.data.collection.stats.floor_price;
    console.log("FLOOR_PRICE", floor_price);
    floor_price = floor_price + floor_price * 0.15
    const its = under_r.filter((land) => land.current_price < floor_price);
    let json_data = JSON.stringify(its);
    fs.writeFile('its.json', json_data, 'utf-8', () => {
        console.log("COMPLETED");
    })
    return its;
}

const getTokens = async () => {
    let url_stats_2 = 'https://api.opensea.io/api/v1/collection/decentraland';
    let tokens_str = listings.map((listing) => listing.token_id);
    console.log(tokens_str.length);
    let undervalued = [];
    const response_stats = await axios.get(url_stats_2);
    const floor_price = response_stats.data.collection.stats.floor_price;
    console.log("FLOOR_PRICE", floor_price);

    for (let tokenId of tokens_str) {
        //console.log("TOKENS STR>> ",tokens_str);
        //let cnt = 0;
        let url_valuation = `https://services.itrmachines.com/test/decentraland/map?tokenId=${tokenId}`;
        //console.log(url_valuation);
        try {
            const response = await axios.get(url_valuation);
            //console.log("RESPONSE DATA",response.data);
            let name = Object.keys(response.data).map((land) => response.data[land].name);
            let image = Object.keys(response.data).map((land) => response.data[land].images.image_url);
            let eth_predicted_price = Object.keys(response.data).map((land) => response.data[land].eth_predicted_price);
            console.log("RES", eth_predicted_price[0]);
            for (const listing of listings) {
                //console.log("CU_P", listing.current_price);
                //console.log("ETH_PP", eth_predicted_price[0]);
                let comparedValue = ((listing.current_price.eth_price - eth_predicted_price[0]) / eth_predicted_price[0]) * 100;
                //console.log("VALUE >> ", comparedValue);
                if (comparedValue < 0 && comparedValue >= -30 && listing.current_price.eth_price < (floor_price + floor_price * 0.15)) {
                    let land = {
                        token_id: listing.token_id,
                        current_price: listing.current_price.eth_price,
                        eth_predicted_price: eth_predicted_price,
                        undervalued_percentage: comparedValue,
                    }
                    undervalued.push(land);
                }
                listing.name = name[0];
                listing.image = image[0];
            }
        } catch (error) {
            console.log(error);
        }
    }
    let json_listings = JSON.stringify(listings);
    fs.writeFile('listings_v2.json', json_listings, 'utf-8', () => {
        console.log("LISTINGS V2 COMPLETE");
    })
    return undervalued;
}

const getListings = async () => {
    let cnt = 0;
    let url = 'https://services.itrmachines.com/test-opensea/service/getTokens';
    let url_stats = 'https://testnets-api.opensea.io/api/v1/collection/decentraland-oxicwpsnsw';
    //let listings = [];
    let requestBody = {};
    let tokens = [];
    let undervalued = await getTokens();
    console.log("UNDERVALUED LEN >", undervalued.length);
    let json_undervalued = JSON.stringify(undervalued);
    fs.writeFile('undervalued_v2.json', json_undervalued, 'utf-8', () => {
        console.log('READY');
    })
    
    fs.createReadStream("./listDecentraland.csv")
        .pipe(parse({
            delimiter: ","
        })).on("data", (row) => {
            //console.log(row);
            tokens.push(row);
        }).on('end', async () => {
            //console.log("FINISHED", tokens[0]);
            const chunks = sliceIntoChunks(tokens[0], 1000);

            /*for (const chunk of chunks) {
                requestBody = {
                    collection: "0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d",
                    tokenIds: chunk,
                }
                do {
                    try {
                        console.log("REQUESTING >>> ...");
                        const response = await axios.post(url, requestBody);
                        //console.log(response.data.results);
                        const data = response.data.results.filter((t) => t.current_price != null);
                        listings.push(...data);
                        //console.log("DATA>", listings);
                        cnt = 3
                    } catch (error) {
                        console.log(error);
                        cnt++;
                        waitTime(3000);
                    }
                } while (cnt < 3);
            }

            fs.writeFile('listings_v3.json', json_data, 'utf-8', () => {
                console.log('READY');
            })*/
        });
}

function getCurrentDate() {
    let date = new Date();
    return "" + ((10000 * date.getFullYear()) + (100 * (1 + date.getMonth())) + date.getDate());
}

function getTokenDivider(symbol) {
    if (symbol === 'USDC')
        return 1e6;
    if (symbol === 'CUBE')
        return 1e8;
    return 1e18;
}

async function getSymbolETHPrice(symbol, date) {
    if (symbol === 'USDC')
        return await getEthPrice('usd-coin', date);
    if (symbol === 'DAI')
        return await getEthPrice('dai', date);
    if (symbol === 'CUBE')
        return await getEthPrice('somnium-space-cubes', date);
    if (symbol === 'MANA')
        return await getEthPrice('decentraland', date);
    if (symbol === 'SAND')
        return await getEthPrice('the-sandbox', date);
    return 1;
}

const getListingsFromOpenSea = async () => {
    const options = {
        method: "GET",
        headers: { Accept: "application/json" },
    }
    let tokens = listings.map((listing) => listing.token_id);
    let chunks = sliceIntoChunks(tokens, 20);
    let listings_testnet = [];
    for (let index = 0; index < 2; index++) {
        for (const chunk of chunks) {
            let tokens_str = "";
            for (let j = 0; j < chunk.length; j++) {
                const token_id = chunk[j];
                tokens_str += "token_ids=" + token_id + "&";
            }
            //console.log(tokens_str);
            try {
                let url = `https://testnets-api.opensea.io/v2/orders/goerli/seaport/listings?asset_contract_address=0x6e0118c38b794c81a70995cf088f0978683565c3&${tokens_str}`;
                const response = await axios.get(url, options);
                console.log("ORDERS>>>", response.data);
                const orders = response.data.orders;
                if (orders.length > 0) {
                    for (const order of orders) {
                        const symbol = order.taker_asset_bundle.asset_contract.symbol;
                        const current_date = getCurrentDate();
                        const current_price = parseInt(order.current_price) / getTokenDivider(symbol);
                        const coin_eth_price = await getSymbolETHPrice(symbol, current_date);
                        const eth_price = current_price * coin_eth_price;
                        const name = order.maker_asset_bundle.assets[0].name;
                        const description = order.maker_asset_bundle.assets[0].description;
                        const token_id = order.maker_asset_bundle.assets[0].token_id;
                        const image = order.maker_asset_bundle.assets[0].image_url;
                        let dataToSave = {
                            token_id: token_id,
                            name: name,
                            description: description,
                            image: image,
                            current_price: eth_price,
                            symbol: symbol,
                        }
                        listings_testnet.push(dataToSave);
                    }
                }
            } catch (error) {
                console.log(error);
            }
            waitTime(3000);
        }
    }
    let json_data = JSON.stringify(listings_testnet);
    fs.writeFile("listings_testnet.json", json_data, 'utf-8', () => {
        console.log('LISTINGS TESTNET DONE');
    })
}

function sliceIntoChunks(arr, chunkSize) {
    const res = [];
    for (let index = 0; index < arr.length; index += chunkSize) {
        const chunk = arr.slice(index, index + chunkSize);
        res.push(chunk);
    }
    return res;
}

function waitTime(millis) {
    let start = Date.now(), currentDate = null;
    do { currentDate = Date.now(); } while (currentDate - start < millis);
}

module.exports = { getListings, getListingsFromOpenSea, getIt, repair, repairUnder };