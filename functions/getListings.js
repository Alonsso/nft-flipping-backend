const axios = require('axios');
//const fs = require("fs").promises;
const fs = require('fs');
const { parse } = require("csv-parse");
const listings = require('../listings.json');

const getTokens = async () => {
    //let json_data = JSON.stringify(listings);
    console.log(listings.length);
    let tokens_str = listings.map((listing) => listing.token_id);
    console.log(tokens_str.length);
    let undervalued = [];
    for (let tokenId of tokens_str) {
        //console.log("TOKENS STR>> ",tokens_str);
        //let cnt = 0;
        let url_valuation = `https://services.itrmachines.com/test/decentraland/map?tokenId=${tokenId}`;
        //console.log(url_valuation);
        try {
            const response = await axios.get(url_valuation);
            //console.log("RESPONSE DATA",response.data);
            let eth_predicted_price = Object.keys(response.data).map((land) => response.data[land].eth_predicted_price);
            console.log("RES", eth_predicted_price[0]);
            for (const listing of listings) {
                //console.log("CU_P", listing.current_price);
                //console.log("ETH_PP", eth_predicted_price[0]);
                let comparedValue = ((listing.current_price.eth_price - eth_predicted_price[0]) / eth_predicted_price[0]) * 100;
                //console.log("VALUE >> ", comparedValue);
                if (comparedValue < 0 && comparedValue >= -30) {
                    let land = {
                        token_id: tokenId,
                        current_price: listing.current_price.eth_price,
                        eth_predicted_price: eth_predicted_price,
                        undervalued_percentage: comparedValue,
                    }
                    undervalued.push(land);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
    return undervalued;
}

const getListings = async () => {
    let cnt = 0;
    let url = 'https://services.itrmachines.com/test-opensea/service/getTokens';
    //let listings = [];
    let requestBody = {};
    let tokens = [];
    let undervalued = await getTokens();
    //console.log("UNDERVALUED", undervalued);
    let json_undervalued = JSON.stringify(undervalued);
    fs.writeFile('undervalued.json', json_undervalued, 'utf-8', () => {
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
            /*const chunks = sliceIntoChunks(tokens[0], 1000);
            for (const chunk of chunks) {
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
            }*/

            /*fs.writeFile('listings.json', json_data, 'utf-8', () => {
                console.log('READY');
            })*/
        });
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

module.exports = { getListings };