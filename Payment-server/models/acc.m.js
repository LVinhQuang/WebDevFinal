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

    static async getBalanceByID(id) {
        try {
            const data = await db.oneOrNone(`SELECT "Balance" FROM "Account" WHERE "AccID" = $1`, [id]);
            return data;
        } catch (err) {
            throw err;
        }
    }

    static async getBalanceByShopID(shopID) {
        try {
            const data = await db.oneOrNone(`SELECT "Balance" FROM "Account" WHERE "ShopID" = $1`, [shopID]);
            return data.Balance;
        } catch (err) {
            throw err;
        }
    }

    static async getIdByUserID(userId) {
        try {
            const data = await db.one(`SELECT "AccID" FROM "Account" WHERE "ShopID" = $1`, [userId]);
            return data.AccID;
        }
        catch (err) {
            throw err;
        }
    }
}