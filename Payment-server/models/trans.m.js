const db = require("../utils/db");
const pgp = require("pg-promise")({capSQL: true});

module.exports = class Trans {
    static async getBalanceByID(id) {
        try {
            const data = await db.oneOrNone(`SELECT "Balance" FROM "Account" WHERE "AccID" = $1`, [id]);
            return +data.Balance;
        } catch (err) {
            throw err;
        }
    }

    static async updateBalanceByID(id, balance) {
        try {
            const data = await db.oneOrNone(`UPDATE "Account" SET "Balance" = $1 WHERE "AccID" = $2`, [balance, id]);
            return data;
        } catch (err) {
            throw err;
        }
    }

    static async transaction(id, amount, orderID) {
        try {
            const data = await db.proc("proc_transaction", [id, 1, orderID, amount]);
            return data;
        } catch (err) {
            throw err;
        }
    }

    static async saveTrans(id, orderID, amount) {
        try {
            const data = await db.proc("proc_save_trans", [id,1,orderID,amount])
            return data;
        } catch (err) {
            throw err;
        }
    }

    static async getByPage(userID, page, pageSize) {
        try {
            const offset = (page - 1) * pageSize;
            const limit = pageSize;
            const userIDCondition = userID ? `WHERE tb2."ShopID" = '${userID}'` : ''
            const data = await db.any(`SELECT tb1.*, tb2."ShopID" FROM "Transaction" tb1 JOIN "Account" tb2 ON tb1."AccID" = tb2."AccID" ${userIDCondition}  LIMIT ${limit} OFFSET ${offset}`);
            const total = await db.one(`SELECT COUNT(*) FROM "Transaction" tb1 JOIN "Account" tb2 ON tb1."AccID" = tb2."AccID" ${userIDCondition}`);
            const totalData = parseInt(total.count)
            const totalPage = Math.ceil(totalData / pageSize);
            return {
                data: data,
                totalPage: totalPage,
                total: totalData
            }
        } catch (error) {
            throw error;
        }
    }

    static async getTransByOrderID(orderid) {
        const rs = await db.query(`SELECT * FROM "Transaction" WHERE "OrderID" = ${orderid}`)
        return rs;
    }
}