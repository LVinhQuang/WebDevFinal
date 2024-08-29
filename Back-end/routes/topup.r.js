const zaloapiC = require("../controllers/zaloapi.c.js")
const express = require('express')
const router = express.Router();

router.get('/zalo/create', zaloapiC.createOrder)
router.get('/zalo/query', zaloapiC.checkOrderStatus)
router.post('/zalo/callback', zaloapiC.orderResult)

module.exports = router