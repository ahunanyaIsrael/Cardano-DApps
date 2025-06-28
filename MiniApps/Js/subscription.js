import {
    bytesToHex, Cip30Wallet, WalletHelper, TxOutput,
    Assets, bytesToText, hexToBytes, AssetClass,
    Tx, Address, NetworkParams, Value, MintingPolicyHash, Program, ByteArrayData, ConstrData, NetworkEmulator
} from "./helios.js";

import { opt, j } from "./jimba.js";
opt._R = 1;

import { txPrerequisites, init, txFunc, hlib, mint, sendADA } from "./coxylib.js";
import { walletEssentials } from "./CertUtils.js";
import { myAddress, getWalletBalance } from "../MY/im_coxylib.js";

function elId(id) {
    return document.getElementById(id);
}

let walletConnected = false;

elId('connect').addEventListener('click', async (event) => {
    event.preventDefault();
    const wallet = await init(j);
    const balance = await getWalletBalance(wallet);
    
    if (balance) {
        walletConnected = true;
        elId('bal').innerHTML = balance;
        elId('bal').disabled = true;  // Optional: Disable the button after connection
    } else {
        walletConnected = false;
    }
});

function handleBuyButtonClick(event, amount) {
    event.preventDefault();
    if (!walletConnected) {
        alert("Please connect your wallet first.");
        return;
    }
    sendADA(myAddress(), amount);
}

document.querySelector('.buy-button1').addEventListener('click', (event) => handleBuyButtonClick(event, 10));
document.querySelector('.buy-button2').addEventListener('click', (event) => handleBuyButtonClick(event, 30));
document.querySelector('.buy-button3').addEventListener('click', (event) => handleBuyButtonClick(event, 50));
