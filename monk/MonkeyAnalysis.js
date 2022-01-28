async function generateTransaction(hash) {
    let url = "https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=" + hash +
        "&apikey=17MQ9NR6BSEBH3DD2GDVZXC8JB6P8KZ9SS";
    let res = await fetch(url, {mode: 'cors'}).then();
    let content = await res.text();
    let jsonobj = await JSON.parse(content);
    let fromWalletID = jsonobj["result"]["from"];
    let toWalletID = jsonobj["result"]["to"];
    let value = jsonobj["result"]["value"];
    // let timestamp = json["result"]["timestamp"]
    // console.log(timestamp);
    return [fromWalletID, toWalletID, value] //, timestamp]
}


class Transaction {
    constructor(record, hash) {
        let txn = record;
        this.hash = hash;
        this.fromWalletID = txn[0];
        this.toWalletID = txn[1];
        this.value = txn[2];
        // this.timestamp = txn[3];
    }
}

async function generateWalletRecords(id) {
    let url = "https://api.etherscan.io/api?module=account&action=txlist&address=" + id +
        "&startblock=0&endblock=99999999&sort=asc&apikey=17MQ9NR6BSEBH3DD2GDVZXC8JB6P8KZ9SS";
    let res = await fetch(url, {mode: 'cors'});
    let content = await res.text();
    let jsonobj = await JSON.parse(content);

    let arr = jsonobj["result"];
    
    let records = [];
    for (let i = 0; i < Math.min(15, arr.length); i++) {
        try {
            let obj = arr[i]
            let record = await generateTransaction(obj["hash"])
            let txn = new Transaction(record, obj["hash"]);
            records.push(txn);
            //console.log(i + "done")
        } catch(error) {
            console.log(error)
        }
    }
    //console.log("done")
    return records;
}

class WalletRecords {
    constructor(record, id) {
        this.id = id;
        this.records = record;
    }
}



async function findMktPosition(transaction) {
    
    let attempts = 15;
    let record = await generateWalletRecords(transaction.fromWalletID)
    let walletRecords = new WalletRecords(record, transaction.fromWalletID);
    // walletRecords.generateWalletRecords();
    console.log(walletRecords.records);
    for (txn of walletRecords.records) {
        if (txn.fromWalletID != this.mainWalletID) {
            await findTarget(txn.fromWalletID, attempts - 1);
        }
    }
    if (this.found) {
        return 1;
    }
    return 0;
}


async function findTarget(walletID, attempts) {
    var pastWallets = []

    async function helper(walletID, attempts) {
        if (walletID == this.mainWalletID || this.found == true) {
            this.found = true;
        } else if (attempts >= 0) {
            pastWallets.push(walletID);
    
            let record = await generateWalletRecords(walletID)
            let newWallet = new WalletRecords(record, walletID);
            // newWallet.generateWalletRecords();
            for (txn of newWallet.records) {
                if (txn.fromWalletID != walletID) {
                    await helper(txn.fromWalletID, attempts - 1);
                }
            }
        }
    } 
}

async function findTradePartners(walletRecords) {
    // walletRecords.generateWalletRecords();
    let tradeVol = walletRecords.records.length;
    let currentPartners = new Map();

    for (txn of walletRecords.records) {
        if (txn.fromWalletID == walletRecords.id) {
            if (currentPartners.get(txn.toWalletID) != null) {
                currentPartners.set(txn.toWalletID, 1);
            } else {
                currentPartners.set(txn.toWalletID, currentPartners.get(txn.toWalletID) + 1);
            }
        } else {
            if (currentPartners.get(txn.fromWalletID) != null) {
                currentPartners.set(txn.fromWalletID, 1);
            } else {
                currentPartners.set(txn.fromWalletID, currentPartners.get(txn.fromWalletID) + 1);
            }
        }
    }

    let tradePartners = currentPartners.length - 1;
    if (tradePartners / tradeVol < 0.2) {
        return 1;
    }
    return 0;
}

async function findTimeInt(transaction) {
    let record = await generateWalletRecords(transaction.fromWalletID)
    let walletRecords = new WalletRecords(record, transaction.fromWalletID);
    // walletRecords.generateWalletRecords();

    let count = 0;
    for (i = 0; i < walletRecords.records.length - 2; i++) {
        let timeDiff = new Date(walletRecords.records.get(i + 1).timestamp * 1000) -
            new Date(walletRecords.records.get(i + 1).timestamp * 1000);
        let minuteDiff = timeDiff / (1000 * 60);
        // probably have to convert above timestamp from string to datetime
        // need ensure its counted in minutes
        if (minuteDiff < 30) {
            count += 1;
        }
    }

    if (count >= 10) {
        return 1;
    }
    return 0;
}

async function findLargeVal(walletRecords) {
    let totalVal = 0;
    for (txn of walletRecords.records) {
        totalVal += txn.value;
    }

    let tradeVol = walletRecords.records.length;
    if (tradeVol < 10 & totalVal >= 30) {
        return 1;
    }
    return 0;
}


// console.log("hi")
// let txn = prompt("Please enter your transction hash ID", "");
// var record = await generateTransaction(txn)
// var mainTransaction = new Transaction(record, txn);
// var mainWalletID = mainTransaction.fromWalletID;
// var found = false;
// var pastWallets = [];
// var currentPartners = new Map();


async function analyseTransaction(trxn_id) {
    let record = await generateTransaction(trxn_id)
    let t = new Transaction(record, trxn_id)
    let result = await findMktPosition(t) == 1
    console.log(result)
    return result;
}

async function analyseWallet(wallet_id) {
    let record = await generateWalletRecords(wallet_id)
    let w = new WalletRecords(record, wallet_id)
    let result = 0.7 * await findTradePartners(w) + 0.3 * await findLargeVal(w) >= 0.7;
    console.log(result)
    return result
}