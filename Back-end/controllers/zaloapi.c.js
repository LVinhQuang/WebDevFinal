const { createHmac } = require('node:crypto')
const axios = require('axios');
const jwt = require('jsonwebtoken')
const jwtSecondKey = process.env.JWT_SECOND
const HttpError = require("../models/http-error");

const config = {
    appid: "2554",
    key1: "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
    key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
    endpoint: "https://sb-openapi.zalopay.vn/v2/create"
};

module.exports = {
    createOrder: async (req, res, next) => {

        //app_trans_id
        const today = new Date();
        const year = String(today.getFullYear()).slice(-2); // Lấy 2 chữ số cuối của năm
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Lấy tháng (cộng 1 vì tháng bắt đầu từ 0), thêm số 0 nếu cần
        const day = String(today.getDate()).padStart(2, '0'); // Lấy ngày, thêm số 0 nếu cần
        const yymmdd = `${year}${month}${day}`;
        let randomNumber = Math.floor(Math.random() * 1000); // Số ngẫu nhiên từ 0 đến 999
        const app_trans_id = yymmdd + '_' + randomNumber.toString();

        const app_user = "ZaloPayDemo";

        const app_time = Date.now();

        const expire_duration_seconds = 900;

        const amount = req.query.amount;

        const item = JSON.stringify([{ "itemid": "naptien", "itemname": "Nap tien vao tai khoan", "itemprice": amount, "itemquantity": 1 }])

        const description = `Zalo - Thanh toán đơn hàng ${app_trans_id}`;

        const embed_data = JSON.stringify({ "amount": amount, "userID": +req.query.userID });

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

        axios.post(config.endpoint, null, { params: params })
            .then(response => {
                if (response.data.return_code == 1) {
                    const order_url = response.data.order_url;
                    res.status(200).json({order_url});
                }
                else {
                    console.log("FAILED WITH RETURN CODE: ",return_code);
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

            try {
                const token = jwt.sign(
                    {
                        userId
                    },
                    jwtSecondKey,
                    {expiresIn: "1h"}
                )
                const response = await axios.post('https://localhost:5001/api/topup', {
                    userId: userId,
                    amount: amount
                } ,{
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

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

    
}