const { createHmac } = require('node:crypto')
const axios = require('axios');
const jwt = require('jsonwebtoken')
const jwtSecondKey = process.env.JWT_SECOND
const HttpError = require("../models/http-error");
const { getIO } = require('../utils/socketio-service')
const zalopay = require('../models/zalopay.m')
const config = require("../config/zalopay-config")

let io;         //socket to send payment result immediately to client

module.exports = {
    createOrder: async (req, res, next) => {
        const app_trans_id = req.query.app_trans_id;
        const expire_duration_seconds = config.order_expiration;
        const amount = +req.query.amount;
        const userID = req.query.userID;

        //create payment order params: app_id, app_user, app_trans_id, app_time, expire_duration_seconds, amount, item, description, embed_data, bank_code, mac, callback_url
        const params = zalopay.createOrderParams(app_trans_id, amount, userID);

        //send create order request
        axios.post(config.
            create_endpoint, null, { params: params })
            .then(response => {
                if (response.data.return_code == 1) {
                    const order_url = response.data.order_url;
                    res.status(200).json({ order_url });
                }
                else {
                    console.log("FAILED WITH RETURN CODE: ", response.data.return_code);
                    res.sendStatus(500);
                }
            })
            .catch(e => {
                console.log(e);
            })

        //polling for order result in case callback is missed
        let return_code = 3;        //order result: 1.success, 2.failed, 3.processing
        const checkStatus_PostConfig = zalopay.createOrderStatus_PostConfig(params.app_trans_id);
        const intervalID = setInterval(() => {
            if (return_code == 3 && Date.now() <= (params.app_time + config.order_expiration * 60 * 1000)) {
                console.log("START")
                axios(checkStatus_PostConfig)
                    .then(async function (response) {
                        const data = response.data;
                        return_code = data.return_code
                        if (return_code != 3) {
                            const io = getIO();
                            const sockets = await io.fetchSockets();
                            for (const socket of sockets) {
                                if (socket.handshake.query.app_trans_id == params.app_trans_id) {
                                    socket.emit('orderResult', { return_code })
                                }
                            }
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
            }
        }, 5000);
        if (return_code != 3) {
            clearInterval(intervalID)
        } 
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
                        socket.emit('orderResult', { return_code: 1 })
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

        const postConfig = zalopay.createOrderStatus_PostConfig(req.query.app_trans_id)

        axios(postConfig)
            .then(function (response) {
                console.log(response.data);
            })
            .catch(function (error) {
                console.log(error);
            });
    }

}