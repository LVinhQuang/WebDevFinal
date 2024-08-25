const router = require("express").Router();
const topupM = require("../models/topup.m.js")
const accM = require("../models/acc.m.js")
const HttpError = require("../models/http-error.js");

router.post("/", async (req,res,next) => {
    try {
        const data = req.body;
        const id = await accM.getIdByUserID(data.userId);
        const rs = await topupM.increaseBalanceByID(id, data.amount);
        res.json(rs);
    }
    catch (error) {
        next(new HttpError(error.message,500));
    }
    
})

module.exports = router;