import React, { useState, useContext, useEffect } from 'react'
import momo_svg from "../../assets/images/momo_square_pinkbg.svg"
import zalo_png from "../../assets/images/zalo.png"
import axios from "axios"
import { BACK_END_SERVER, TOPUP_API, ACCOUNT_API as accountApi } from '../../keys/BackEndKeys';
import { AuthContext } from "../../context/AuthContext.js";
import { useHttpClient } from '../../hooks/http-hook';
import { io } from "socket.io-client"

export default function TopUp() {
    const [amount, setAmount] = useState(0);
    const [selectedOption, setSelectedOption] = useState('');
    const { token, userId } = useContext(AuthContext);
    const [balance, setBalance] = useState(0);
    const { sendRequest } = useHttpClient();
    const [errMess, setErrMess] = useState(false);
    const handleAmountChange = (event) => {
        setAmount(event.target.value);
    }

    const handleOptionChange = (event) => {
        setSelectedOption(event.target.value);
    }
    const submit_onclick = async () => {
        let intAmount = parseInt(amount);
        if (!intAmount || !selectedOption) {
            setErrMess("Vui lòng điền đầy đủ thông tin")
            return 1;
        }
        else {
            setErrMess("")
        }

        //create params for the transaction
        let userID = JSON.parse(localStorage.getItem('userData')).userId;
        //create app_trans_id
        const today = new Date();
        const year = String(today.getFullYear()).slice(-2); // Lấy 2 chữ số cuối của năm
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Lấy tháng (cộng 1 vì tháng bắt đầu từ 0), thêm số 0 nếu cần
        const day = String(today.getDate()).padStart(2, '0'); // Lấy ngày, thêm số 0 nếu cần
        const yymmdd = `${year}${month}${day}`;
        let randomNumber = Math.floor(Math.random() * 1000); // Số ngẫu nhiên từ 0 đến 999
        const app_trans_id = yymmdd + '_' + randomNumber.toString();

        let params = { amount, userID, app_trans_id }
        console.log(params);

        //send request to create transaction
        let zalo_create_api = TOPUP_API + '/zalo/create'
        const create_response = await axios.get(zalo_create_api, { params })
        if (create_response.status == 200) {

            //open zalo payment gateway
            const order_url = create_response.data.order_url;
            window.open(order_url, '_blank', 'width=800,height=600,toolbar=no,scrollbars=yes,resizable=yes');

            //open web socket to wait for payment result
            const socket = io(BACK_END_SERVER, {
                query: {
                    app_trans_id
                }
            })

            //maximum connection time = payment expire duration
            let timeOutId = setTimeout(() => {
                socket.disconnect();
                console.log('Disconnected from server after 15 minutes');
            }, 15 * 60 * 1000); // 15 minutes

            socket.on('orderResult', (data) => {
                if (data.return_code == 1) {
                    clearTimeout(timeOutId);    //delete timeout if receive result
                    socket.disconnect();
                    window.location.reload();
                }
            })
        }
        else {
            console.log("failed to create transaction")
        }

    }

    function formatWithDot(n) {
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    useEffect(() => {
        async function fetchBalance() {
            const result = await sendRequest(
                `${accountApi}/get-balance/${userId}`,
                "GET",
                {
                    "Content-type": "application/json",
                    "Authorization": `Bearer ${token}`
                });
            const tempBalance = parseInt(result?.balance);
            const balance = formatWithDot(tempBalance);
            setBalance(balance);
        }
        fetchBalance();
    }, [token]);

    return (
        <>
            <div className="info-title mb-4">
                <h3>Top Up Account</h3>
            </div>
            <div className="info-title mb-4">
                <h4>Current balance: <span className="text-info">{balance}</span></h4>
            </div>
            <div className="info-content p-4">
                <div>
                    <label htmlFor="topup-input">Enter the amount you want to add:</label>
                    <input className='ms-2' type="number" id="topup-input" name="topup-input" onChange={handleAmountChange}></input>
                </div>
                <div>
                    <div className='mb-1 me-4 d-inline-block'>
                        <input type="radio" id="momo-choice" name="topup-type" value="momo" onChange={handleOptionChange} />
                        <label htmlFor='momo-choice'><img className='ms-2 me-1' src={momo_svg} width={24} height={24} /></label>
                    </div>
                    <div className='mb-1 me-4 d-inline-block'>
                        <input type="radio" id="zalo-choice" name="topup-type" value="zalo" onChange={handleOptionChange} />
                        <label htmlFor='zalo-choice'><img className='ms-2 me-1' src={zalo_png} width={24} height={24} /></label>
                    </div>
                </div>
                <div>
                    <button className='p-2' onClick={submit_onclick} width={20} style={{ backgroundColor: "#ba6a62", color: "white", border: "none" }}>Process Payment</button>
                </div>
                {errMess &&
                    <div className='alert text-danger'>
                        {errMess}
                    </div>
                }
            </div>
        </>
    )
}
