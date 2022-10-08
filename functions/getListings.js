const axios = require('axios');
//const fs = require("fs").promises;
const fs = require('fs');
const { parse } = require("csv-parse");

const getTokens = async () => {
    let tokens = [];
    //let file = await fs.readFile("./listDecentraland.csv", "utf-8");

    //tokens.push(file)
    return tokens;
}

const getListings = async () => {
    let cnt = 0;
    let url = 'https://services.itrmachines.com/test-opensea/service/getTokens';
    let listings = [];
    let requestBody = {};
    let tokens = [];
    fs.createReadStream("./listDecentraland.csv")
        .pipe(parse({
            delimiter: ","
        })).on("data", (row) => {
            //console.log(row);
            tokens.push(row);
        }).on('end', async () => {
            console.log("FINISHED", tokens[0]);
            const chunks = sliceIntoChunks(tokens[0], 1200);
            for (const chunk of chunks) {
                requestBody = {
                   collection: "0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d",
                   tokenIds: chunk,
               }
               do {
                   try {
                       const response = await axios.post(url, requestBody);
                       //console.log(response.data.results);
                       const data = response.data.results.filter((t) => t.current_price != null);
                       listings.push(data);
                       //console.log("DATA>", data);
                       cnt = 3
                   } catch (error) {
                       console.log(error);
                       cnt++;
                       waitTime(3000);
                   }
               } while (cnt < 3);
            }
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