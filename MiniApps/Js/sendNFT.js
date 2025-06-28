import {
    bytesToHex, Cip30Wallet, WalletHelper, TxOutput,
    Assets, bytesToText, hexToBytes, AssetClass,
    Tx, Address, NetworkParams, Value, MintingPolicyHash, Program, ByteArrayData, ConstrData, NetworkEmulator
} from "./helios.js";

import { opt, j } from "./jimba.js";

// import  {mintAssetsScript} from './mintAssetsScript';
import { txPrerequisites, init, txFunc, hlib, mint, sendADA, sendAssets } from "./coxylib.js";

const getBalance = async () => {
    const walletName = await init(j);
    const wallet = await eval('window.cardano.' + walletName);
    const walletEnabled = await wallet.enable();
    const walletHandler = await walletEnabled;
    const WalletAPI = new Cip30Wallet(walletHandler);
    const walletHelper = new WalletHelper(WalletAPI);
    const balancelovelace = (await walletHelper.calcBalance()).lovelace.toLocaleString();
    document.getElementById('connect-button').innerText = `Bal: ${balancelovelace}`;
    enableForm(); // Enable the form after successful connection
    return balancelovelace;
}

function elId(id) {
    return document.getElementById(id);
}

function enableForm() {
    // Enable the form fields and submit button
    elId('assetName').disabled = false;
    elId('mph').disabled = false;
    elId('address').disabled = false;
    elId('quantity').disabled = false;
    document.querySelector('form button[type="submit"]').disabled = false;
}

document.getElementById('connect-button').addEventListener('click', async (event) => {
    event.preventDefault();
    await getBalance();
});

elId('sendAsset').addEventListener('submit', async (event) => {
    event.preventDefault();
    const address = elId('address').value;
    const mph = elId('mph').value;
    const quantity = parseInt(elId('quantity').value);
    const assetName = elId('assetName').value;
    try {
        await sendAssets(mph, assetName, quantity, address);
        alert('Successfully transferred Assets');
        elId('address').value = '';
        elId('assetName').value = '';
        elId('mph').value = '';
        elId('quantity').value = '';
    } catch (error) {
        alert('Error transferring Asset: ' + error.message);
    }
});
