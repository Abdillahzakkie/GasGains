import { abi as gasGainTokenABI } from './abi/GasGainz.js';
const walletAddress = document.querySelector('.walletAddressinput');
const userBalanceGASG = document.querySelector('.gasg-balance');
const userBalanceDollar = document.querySelector('.gasg-balance-dollar');
const lockedInGasgBalance = document.querySelector('.locked-in-gasg-token');
const lockedInDollarBalance = document.querySelector('.locked-in-dollar-token');
const unlockTokens = document.querySelector('.unstake-token');
const upcomingTokens = document.querySelector('.upcoming-gasg-token');



const ethPriceInput = document.querySelector('.eth-rate-input');
const gasOracle = document.querySelector('.gas_oracle');
const txnLists = document.querySelector('.inject-txns-lists');



const GasGainTokenAddress = '0xc58467b855401EF3FF8FdA9216F236e29f0d6277';
const apiKey = "7QEMXYNDAD5WT7RTA5TQUCJ5NIA99CSYVI";
const startBlock = "11706820";

let web3;
let GasGainToken;
let user;
let ethUSDPrice = 0;

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

        const firstAddressPart = walletShortner(user, 0, 4);
        const lastAddressPart = walletShortner(user, 38, 42);
        walletAddress.textContent = `${firstAddressPart}...${lastAddressPart}`;

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

const walletShortner = (_data, _start, _end) => {
    let result = '';
    for(let i = _start;  i < _end; i++) result = [...result, _data[i]];
    return result.join('');
}


const settings = async () => {
    const _balance = await balanceOf(user);
    // const _unlockableAmount = await getUnlockableAmount();

    let _gasOracle = await (await (fetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${apiKey}`))).json();
    _gasOracle = _gasOracle.result.FastGasPrice;
    gasOracle.textContent = `${_gasOracle}`;

    let _ethUSDPrice = await getCurrentPrice("ethereum");
    _ethUSDPrice = toFixed(_ethUSDPrice.ethereum.usd);
    ethUSDPrice = _ethUSDPrice;
    ethPriceInput.textContent = `ETH $${_ethUSDPrice}`;

    userBalanceGASG.textContent = `${toFixed(fromWei(_balance))} GASG`;
    userBalanceDollar.textContent = `${toFixed("0")} USD`;

    // lockedInGasgBalance.textContent = `${toFixed(fromWei(_unlockableAmount))} GASG`;
    lockedInDollarBalance.textContent = `${toFixed("0")} USD`;

    await getPastEvents();
    await displayTransactionsList();
    await calculateUpcomingRewards();
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

const toFixed = _amount => Number(_amount).toFixed(2);

const getNormalTransactionLists = async () => {
    try {
        const _endBlock = await web3.eth.getBlockNumber();
        const result = await (await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${user}&startblock=${startBlock}&endblock=${_endBlock}&sort=desc&apikey=${apiKey}`)).json();
        return formatTransactionLists(result.result);
    } catch (error) {
        return error.message;
    }
}

const formatTransactionLists = async _data => {
    try {
        let result = await _data.map(item => {
            const { hash, from, to, gasPrice, gasUsed, nonce } = item;
            return {
                hash,
                from,
                to,
                gasPrice,
                gasUsed,
                nonce
            }
        })
        return result;
    } catch (error) {
        return error.message;
    }
}

const shortener = (_data, isHash) => {
    const tempItems = _data.split('');
    let result = [];

    if(isHash) {
        for(let i = 60;  i < tempItems.length; i++) result = [...result, tempItems[i]];
        return result.join('');
    }
    for(let i = 37;  i < tempItems.length; i++) result = [...result, tempItems[i]];
    return result.join('');
}

const getCurrentPrice= async (token) => {
    try {
        let result = await (await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=USD`)).json();
        return result;
    } catch (error) {
        console.log(error)
    }
}

const displayTransactionsList = async () => {
    try {
        let tempItems = [];
        const _normalTransactionists = await getNormalTransactionLists();
        let nonce = _normalTransactionists.length - 1;

        if(_normalTransactionists.length === 0) return txnLists.innerHTML = `<tr>No transaction history found</tr>`;

        for(let i = 0; i < _normalTransactionists.length; i++) {
            const { from, to, hash, gasUsed, gasPrice } =  _normalTransactionists[i];
            let ethGasUsed = Number(gasUsed) * Number(gasPrice);
            ethGasUsed = fromWei(ethGasUsed * Number(ethUSDPrice));
            tempItems = [
                ...tempItems,
                `
                    <tr>
                        <td>${nonce}</td>
                        <td>
                            <a href=https://etherscan.io/tx/${hash} target="_blank" style="color: black">
                                0x...${shortener(hash, true)}
                            </a>
                        </td>
                        <td>
                            <a href=https://etherscan.io/address/${from} target="_blank" style="color: black">
                                0x...${shortener(from, false)}
                            </a>
                        </td>
                        <td>
                            <a href=https://etherscan.io/address/${to} target="_blank" style="color: black">
                                0x...${shortener(to, false)}
                            </a>
                        </td>
                        <td>$${toFixed(ethGasUsed)}</td>
                        <td>100</td>
                    </tr>
                `
            ];
            nonce--;
        }
        tempItems = tempItems.join("");
        txnLists.innerHTML = tempItems;
        return tempItems;
    } catch (error) {
        return error.message;
    }
}


const getPastEvents = async () => {
    try {
        // Last blocknumber = 11457376
        const latestBlockNumber = await web3.eth.getBlockNumber();

        let result = await GasGainToken.getPastEvents("Deposit", { fromBlock: '0', toBlock: latestBlockNumber });
        result = await formatEvents(result);
        
        let userLockedBalance = 0;
        const _user = web3.utils.toChecksumAddress(user);
        for(let i = 0; i < result.length; i++) {
            if(result[i].depositor === _user) {
                userLockedBalance = result[i].depositAmount;
            }
        }
        lockedInGasgBalance.textContent = `${toFixed(userLockedBalance)} GASG`;
        return result;
    } catch (error) { console.log(error) }
}

const formatEvents = async _data => {
    try {
        let returnValues = [];

       for(let i = 0; i < _data.length; i++) {
            const _values = _data[i].returnValues;
            returnValues = [...returnValues, {
                depositor: _values.depositor,
                depositAmount: fromWei(_values.depositAmount),
                timestamp: _values.timestamp,
                unlockTimestamp: _values.unlockTimestamp
            }];

       }
        return returnValues;
    } catch (error) { console.log(error) }
}

const calculateUpcomingRewards = async () => {
    try {
        const _txns = await getNormalTransactionLists();
        const _gasgainsPrice = 3;
        let _total = 0;
        for(let i = 0; i < _txns.length; i++) {
            const ethGasUsed = Number(_txns[i].gasUsed) * Number(_txns[i].gasPrice);
            _total += Number(ethGasUsed);
        }
        _total = fromWei(Number(ethUSDPrice) * Number(_total))
        upcomingTokens.textContent = `${toFixed(Number(_total) / _gasgainsPrice)} GASG`;
    } catch (error) {
        console.log(error.message);
        return error.message;
    }
}

unlockTokens.addEventListener('click', async e => {
    e.preventDefault();
    try {
        const _lockdBalance = await getUnlockableAmount();
        if(Number(_lockdBalance) <= 0) return alert("You have zero token locked");
        await GasGainToken.methods.unlock().send({ from: user });
        alert("Transaction successful");
    } catch (error) {
        console.log(error.message);
        return error.message;
    }
})