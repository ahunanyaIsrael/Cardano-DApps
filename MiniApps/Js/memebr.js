import {
    bytesToHex, Cip30Wallet, WalletHelper, TxOutput,
    Assets, bytesToText, hexToBytes, AssetClass,
    Tx, Address, NetworkParams, Value, MintingPolicyHash, Program, ByteArrayData, ConstrData, NetworkEmulator
} from "./helios.js";

import { opt, j } from "./jimba.js";
opt._R = 1;

// import  {mintAssetsScript} from './mintAssetsScript';
import { txPrerequisites, init, txFunc, hlib, mint, sendADA } from "./coxylib.js";


const getBalance = async () => {
    const walletName = await init(j);
    const wallet = await eval('window.cardano.' + walletName);
    const walletEnabled = await wallet.enable();
    const walletHandler = await walletEnabled;
    const WalletAPI = new Cip30Wallet(walletHandler);
    const walletHelper = new WalletHelper(WalletAPI);
    const balancelovelace = (await walletHelper.calcBalance()).lovelace.toLocaleString();
    document.getElementById('connect').innerText = `Bal: ${balancelovelace}`;
    return balancelovelace;
}

function elId(id) {
    return document.getElementById(id);
}

document.getElementById('connect-button').addEventListener('click', async (event) => {
    event.preventDefault();
    await getBalance();
});

elId('gold').addEventListener('click', async (even)=>{
    even.preventDefault();
    await sendADA('addr_test1qp7qgxsu9n0l9z4n68qq0zlgyr4nwvqdddafup2cq2mmlr7mytlugk5wkh7ngcgtx8snrdmjjw8u9cae80ms2u8n3pmqymdjqt',50);
})
elId('platnium').addEventListener('click', async (event)=>{
    event.preventDefault();
    await sendADA('addr_test1qp7qgxsu9n0l9z4n68qq0zlgyr4nwvqdddafup2cq2mmlr7mytlugk5wkh7ngcgtx8snrdmjjw8u9cae80ms2u8n3pmqymdjqt', 30);
})
elId('bronze').addEventListener('click', async (event) =>{
    event.preventDefault();
    await sendADA('addr_test1qp7qgxsu9n0l9z4n68qq0zlgyr4nwvqdddafup2cq2mmlr7mytlugk5wkh7ngcgtx8snrdmjjw8u9cae80ms2u8n3pmqymdjqt', 10);
})
