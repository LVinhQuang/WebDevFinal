const db = require("../utils/db");
const pgp = require("pg-promise")({capSQL: true});

module.exports = class Account {
    constructor({ShopID, Balance = 3000000}) {
        this.ShopID = ShopID;
        this.Balance = Balance;
    }

    static async add(acc) {
        try {
            const query = pgp.helpers.insert(acc, null, "Account");
            const data = await db.one(query + "RETURNING *");
            return data;
        } catch (err) {
            throw err;
        }
    }
}