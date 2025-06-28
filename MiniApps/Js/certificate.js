import {
    bytesToHex, Cip30Wallet, WalletHelper, TxOutput,
    Assets, bytesToText, hexToBytes, AssetClass,
    Tx, Address, NetworkParams, Value, MintingPolicyHash, Program, ByteArrayData, ConstrData, NetworkEmulator
} from "./helios.js";

import { opt, j } from "./jimba.js";
opt._R =1;

import { txPrerequisites, init, txFunc, hlib, mint } from "./CertUtils.js";

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
    elId('description').disabled = false;
    elId('name').disabled = false;
    elId('Cname').disabled = false;
    elId('recipient').disabled = false;
    elId('date').disabled = false;
    elId('Unique').disabled = false;
    elId('img').disabled = false;
    document.querySelector('form button[type="submit"]').disabled = false;
}

document.getElementById('connect-button').addEventListener('click', async (event) => {
    event.preventDefault();
    const balance = await getBalance();
    if (balance) {
        enableForm();
    }
});

document.getElementById('mintNFT').addEventListener('submit', async (event) => {
    event.preventDefault();
    const certName = elId('name').value;
    const courseName = elId('Cname').value;
    const recipient = elId('recipient').value;
    const date = elId('date').value;
    const UnId = elId('Unique').value;
    const description = elId('description').value;
    const imgUrl = elId('img').value;

    // Call the mint function with all required parameters
    await mint(certName, courseName, recipient, date, UnId, description, imgUrl);
});
import{fetchUtxos, getAssetDetails, getAssetFingerprint, generateRandomBytes}from "../MY/im_coxylib.js";
const policy_id = '37332faaea15c0312112b825d1d368d1a1c4b98efa5b9a8f2f9c0cde';
const tokenName = 'sunset';

addEventListener('DOMContentLoaded', async (event)=>{
    j.log(await fetchUtxos('addr_test1qp7qgxsu9n0l9z4n68qq0zlgyr4nwvqdddafup2cq2mmlr7mytlugk5wkh7ngcgtx8snrdmjjw8u9cae80ms2u8n3pmqymdjqt'))
    j.log(await generateRandomBytes(24));
})