const config = require('../config/zalopay-config');
const { createHmac } = require('node:crypto');
const qs = require('qs')

module.exports = {
    createOrderParams: (app_trans_id, amount, userID) => {
        //create payment order params: app_id, app_user, app_trans_id, app_time, expire_duration_seconds, amount, item, description, embed_data, bank_code, mac, callback_url

        const app_user = "ZaloPayDemo";

        const app_time = Date.now();

        const expire_duration_seconds = config.order_expiration;

        const item = JSON.stringify([{ "itemid": "naptien", "itemname": "Nap tien vao tai khoan", "itemprice": amount, "itemquantity": 1 }])

        const description = `Zalo - Thanh toán đơn hàng ${app_trans_id}`;

        const embed_data = JSON.stringify({ "amount": amount, "userID": userID, "app_trans_id": app_trans_id });

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

        return params
    },

    createOrderStatus_PostConfig: (app_trans_id) => {
        let postData = {
            app_id: config.appid,
            app_trans_id: app_trans_id,
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

        return postConfig;
    }
}