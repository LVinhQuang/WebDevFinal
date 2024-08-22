import React, { useState } from 'react'
import momo_svg from "../../assets/images/momo_square_pinkbg.svg"
import { colors } from '@mui/material';
import zalo_png from "../../assets/images/zalo.png"

export default function TopUp() {
    const [amount,setAmount] = useState(0);
    const [selectedOption, setSelectedOption] = useState('');
    const [errMess, setErrMess] = useState(false);
    const handleAmountChange = (event) => {
        setAmount(event.target.value);
    }

    const handleOptionChange = (event) => {
        setSelectedOption(event.target.value);
    }
    const submit_onclick = () => {
        let intAmount = parseInt(amount);
        if (!intAmount || !selectedOption) {
            setErrMess("Vui lòng điền đầy đủ thông tin")
            return 1;
        }
        else {
            setErrMess("")
        }

        console.log(amount,selectedOption);
    }
    return (
        <>
            <div className="info-title mb-4">
                <h3>Top Up Account</h3>
            </div>
            <div className="info-content p-4">
                <div>
                    <label htmlFor="topup-input">Enter the amount you want to add:</label>
                    <input className='ms-2' type="number" id="topup-input" name="topup-input" onChange={handleAmountChange}></input>
                </div>
                <div>
                    <div className='mb-1 me-4 d-inline-block'>
                        <input type="radio" id="momo-choice" name="topup-type" value="momo" onChange={handleOptionChange}/>
                        <label htmlFor='momo-choice'><img className='ms-2 me-1' src={momo_svg} width={24} height={24}/></label>
                    </div>
                    <div className='mb-1 me-4 d-inline-block'>
                        <input type="radio" id="zalo-choice" name="topup-type" value="zalo" onChange={handleOptionChange}/>
                        <label htmlFor='zalo-choice'><img className='ms-2 me-1' src={zalo_png} width={24} height={24}/></label>
                    </div>
                </div>
                <div>
                    <button className='p-2' onClick={submit_onclick} width={20} style={{backgroundColor: "#ba6a62", color: "white", border: "none"}}>Process Payment</button>
                </div>
                {   errMess &&
                    <div className='alert text-danger'>
                        {errMess}
                    </div>
                }
            </div>
        </>
    )
}
