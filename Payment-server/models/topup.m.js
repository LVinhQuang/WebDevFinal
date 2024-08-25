const db = require("../utils/db");
const pgp = require("pg-promise")({capSQL: true});
const transM = require("./trans.m.js")

module.exports = class TopUp {
    static async increaseBalanceByID(id, amount) {
        const curBalance = await transM.getBalanceByID(id);
        const data = await transM.updateBalanceByID(id, curBalance + amount);
    }
}