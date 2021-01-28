import { abi as gasGainTokenABI } from './abi/GasGainz.js';
const approveForm = document.querySelector('.approve-form');
const stakeForm = document.querySelector(".stake-form");

const GasGainTokenAddress = '0xc58467b855401EF3FF8FdA9216F236e29f0d6277';

let web3;
let GasGainToken;
let user;

const toWei = _amount => web3.utils.toWei(_amount.toString(), 'ether');
const fromWei = _amount => web3.utils.fromWei(_amount.toString(), 'ether');

window.addEventListener('DOMContentLoaded', async () => {
  await connectDAPP();
})

const loadWeb3 = async () => {
    if(window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        // cancel autorefresh on network change
        window.ethereum.autoRefreshOnNetworkChange = false;

    } else if(window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
    } else {
        alert("Non-Ethereum browser detected. You should consider trying Metamask")
    }
}

const loadBlockchainData = async () => {
    let networkType;
    try {
        web3 = window.web3;
        networkType = await web3.eth.net.getNetworkType();

        if(networkType !== "main") return alert("Connect wallet to a main network");

        GasGainToken = new web3.eth.Contract(gasGainTokenABI, GasGainTokenAddress);
        const accounts = await web3.eth.getAccounts();
        user = accounts[0];

        await settings();
    } catch (error) {
        console.error(error.message);
        return error;
    }
}

const connectDAPP = async () => {
    await loadWeb3();
    await loadBlockchainData(); 
}



const settings = async () => {

}

const balanceOf = async _account => {
    const _user = _account ? _account : user;
    return await GasGainToken.methods.balanceOf(_user).call();
}

const getUnlockableAmount = async () => {
    try {
        const result = await GasGainToken.methods.getUnlockableAmount(user).call();
        return result;
    } catch (error) {
        console.log(error.message);
        return errror.message;
    }
}

// const displayTokenWithdrawalTime = async _data => {
//     const _duration = "2678400";

//     let _savingTime = 0;
//     let _withdrawalTime = 0;

//     for(let i = 0; i < _data.length; ++i) {
//         if(_data[i].stakeholder !== user) continue;

//         _savingTime = await formatDate(_data[i].unlockTime);
//         _withdrawalTime = await formatDate((Number(_savingTime) + Number(_duration)).toString());
//     }

//     if(Number(_savingTime) <= 0) return;
//     savingTime.textContent = `Saving time: ${(dayjs.unix(_savingTime)).$d}`;
//     withdrawalTime.textContent = `Withdrawal time: ${(dayjs.unix(_withdrawalTime)).$d}`;
// }

approveForm.addEventListener('submit', async e => {
    e.preventDefault();
    try {
        const _lockedBalance = await getUnlockableAmount();
        if(Number(_lockedBalance) > 0) return alert("Tokens has already been locked.");
        const input = document.querySelector('.approve-form input').value;
        if(isNaN(input) || Number(input) < 0) return;
        if(Number(input) < 100) return alert("Minimum approve balance must be greater than or equal to 100 GASG");
        await GasGainToken.methods.approve(user, toWei(input)).send({
            from: user
        });
        alert("Transaction successful");    
    } catch (error) {
        console.log(error.message);
        return error.message;
    }
})

stakeForm.addEventListener('submit', async e => {
    e.preventDefault();
    try {
        const _balance = await balanceOf(user);
        const input = document.querySelector('.stake-form input').value;

        if(isNaN(input) || Number(input) < 0) return;
        if(Number(_balance) <= 0) return alert("You have zero GASG Token");
        if(Number(input) < 100) return alert("Minimum stake must be greater than or equal to 100 GASG");
        
        await GasGainToken.methods.lock(toWei(input)).send({
            from: user
        });
        alert("Transaction successful");    
    } catch (error) {
        console.log(error.message);
        return error.message;
    }
})