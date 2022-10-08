const { getListings, getListingsFromOpenSea, getIt, repair, repairUnder } = require("./functions/getListings");

(async ()=>{
    //await getListings();
    //await getListingsFromOpenSea();
    const its = await getIt();
    //console.log(its);
    //await repairUnder();
})();