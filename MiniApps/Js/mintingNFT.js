import {
    bytesToHex, Cip30Wallet, WalletHelper, TxOutput,
    Assets, bytesToText, hexToBytes, AssetClass,
    Tx, Address, NetworkParams, Value, MintingPolicyHash, Program, ByteArrayData, ConstrData, NetworkEmulator
} from "./helios.js";

import { opt, j } from "./jimba.js";
opt._R =1;

// import  {mintAssetsScript} from './mintAssetsScript';
import { txPrerequisites, init, txFunc, hlib, mint} from "./coxylib.js";

const getBalance = async () => {
    const walletName = await init(j);
    const wallet = await eval('window.cardano.' + walletName);
    const walletEnabled = await wallet.enable();
    const walletHandler = await walletEnabled;
    const WalletAPI = new Cip30Wallet(walletHandler);
    const walletHelper = new WalletHelper(WalletAPI);
    const balancelovelace = (await walletHelper.calcBalance()).lovelace.toLocaleString();
    document.getElementById('connect').innerText = `Bal: ${balancelovelace}`;
    enableForm(); // Enable the form after successful connection
    return balancelovelace;
}

function elId(id) {
    return document.getElementById(id);
}

function enableForm() {
    // Enable the form fields and submit button
    document.getElementById('name').disabled = false;
    document.getElementById('description').disabled = false;
    document.getElementById('img').disabled = false;
    document.querySelector('form button[type="submit"]').disabled = false;
}

document.getElementById('connect-button').addEventListener('click', async (event) => {
    event.preventDefault();
    await getBalance();
});

document.getElementById('mintNFT').addEventListener('submit', async (event) => {
    event.preventDefault();
    const assetName = elId('name').value;
    const description = elId('description').value;
    const imgUrl = elId('img').value;
    await mint(assetName, description, imgUrl);
    // await mint('Farrare SF90', 'Super Fast', 'https://img.autotrader.co.za/29649969/Crop640x480');
});
