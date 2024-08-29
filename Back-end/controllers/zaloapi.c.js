const { createHmac } = require('node:crypto')
const axios = require('axios');
const jwt = require('jsonwebtoken')
const jwtSecondKey = process.env.JWT_SECOND
const HttpError = require("../models/http-error");
const qs = require('qs')
const {getIO} = require('../utils/socketio-service')

const config = {
    appid: "2554",
    key1: "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
    key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
    create_endpoint: "https://sb-openapi.zalopay.vn/v2/create",
    query_endpoint: "https://sb-openapi.zalopay.vn/v2/query",
    order_expiration: 900       //15 minutes
};

module.exports = {
    createOrder: async (req, res, next) => {

        const app_trans_id = req.query.app_trans_id;

        const app_user = "ZaloPayDemo";

        const app_time = Date.now();

        const expire_duration_seconds = config.order_expiration;

        const amount = +req.query.amount;

        const item = JSON.stringify([{ "itemid": "naptien", "itemname": "Nap tien vao tai khoan", "itemprice": amount, "itemquantity": 1 }])

        const description = `Zalo - Thanh toán đơn hàng ${app_trans_id}`;

        const embed_data = JSON.stringify({ "amount": amount, "userID": req.query.userID, "app_trans_id": app_trans_id });

        const bank_code = "";

        const callback_url = process.env.ZALO_CALLBACK_URL + "/api/topup/zalo/callback"

        //mac
        let data_to_encode = config.appid + "|" + app_trans_id + '|' + app_user + '|' + amount + '|' + app_time + '|' + embed_data + '|' + item;
        console.log(data_to_encode);
        const mac = createHmac('sha256', config.key1)
            .update(data_to_encode)
            .digest('hex')

        let params = {
            app_id: config.appid,
            app_user,
            app_trans_id,
            app_time,
            expire_duration_seconds,
            amount,
            item,
            description,
            embed_data,
            bank_code,
            mac,
            callback_url
        };

        axios.post(config.
            create_endpoint, null, { params: params })
            .then(response => {
                if (response.data.return_code == 1) {
                    const order_url = response.data.order_url;
                    res.status(200).json({ order_url });
                }
                else {
                    console.log("FAILED WITH RETURN CODE: ", return_code);
                    res.sendStatus(500);
                }
            })
            .catch(e => {
                console.log(e);
            })
    },

    orderResult: async (req, res, next) => {
        const data = req.body.data;
        const mac = req.body.mac;

        let checksum = createHmac('sha256', config.key2)
            .update(data)
            .digest('hex');

        if (checksum != mac) {
            console.log("WRONG");
            res.sendStatus(400);
        } else {
            let data = JSON.parse(JSON.parse(req.body.data).embed_data);
            let amount = data.amount;
            let userId = data.userID;
            let app_trans_id = data.app_trans_id;

            try {
                const token = jwt.sign(
                    {
                        userId
                    },
                    jwtSecondKey,
                    { expiresIn: "1h" }
                )
                const response = await axios.post('https://localhost:5001/api/topup', {
                    userId: userId,
                    amount: amount
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                const io = getIO();
                const sockets = await io.fetchSockets();
                for (const socket of sockets) {
                    if (socket.handshake.query.app_trans_id == app_trans_id) {
                        socket.emit('orderResult', {return_code: 1})
                    }
                }

                res.sendStatus(200);

            } catch (err) {
                console.error(err)
                const error = new HttpError(
                    'Something wrong when add jwt in transaction controller', 500
                );
                return next(error);
            }
        }
    },

    checkOrderStatus: async (req, res, next) => {

        let postData = {
            app_id: config.appid,
            app_trans_id: req.query.app_trans_id,
        }

        let data = postData.app_id + "|" + postData.app_trans_id + "|" + config.key1; // appid|app_trans_id|key1
        postData.mac = createHmac('sha256',config.key1).update(data).digest('hex');

        let postConfig = {
            method: 'post',
            url: config.query_endpoint,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: qs.stringify(postData)
        };

        axios(postConfig)
            .then(function (response) {
                console.log(JSON.stringify(response.data));
            })
            .catch(function (error) {
                console.log(error);
            });
    }

}