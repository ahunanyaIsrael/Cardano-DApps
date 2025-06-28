import {
    bytesToHex, Cip30Wallet, WalletHelper, TxOutput,
    Assets, bytesToText, hexToBytes, AssetClass,
    Tx, Address, NetworkParams, Value, MintingPolicyHash, Program, ByteArrayData, ConstrData, NetworkEmulator
} from "../Js/helios.js";

import { opt, j } from "../Js/jimba.js";
import { mintAssetsScript } from '../Js/mintAssetsScript.js';

export const hlib = {
    Value: Value,
    Tx: Tx,
    Assets: Assets,
    NetworkParams: NetworkParams,
    ByteArrayData: ByteArrayData,
    BigInt: BigInt,
    ConstrData: ConstrData,
    TxOutput: TxOutput,
    Address: Address,
    hexToBytes: hexToBytes,
    Program: Program,
    MintingPolicyHash: MintingPolicyHash
};
export const myAddress = ()=>{
    return 'addr_test1qp7qgxsu9n0l9z4n68qq0zlgyr4nwvqdddafup2cq2mmlr7mytlugk5wkh7ngcgtx8snrdmjjw8u9cae80ms2u8n3pmqymdjqt';
}
export const txPrerequisites = {
    maxTxFee: 3000000,
    minChangeAmt: 2000000,
    networkParamsUrl: "https://d1t0d7c2nekuk0.cloudfront.net/preprod.json",
    minAda: 4000000
};

/**
 * Fetch the current UTXOs for a given address.
 * @param {string} address - The Bech32 address to fetch UTXOs for.
 * @returns {Promise<UTxO[]>} - Returns an array of UTXOs.
 */
export const fetchUtxos = async (address) => {
    try {
        const url = `https://cardano-preprod.blockfrost.io/api/v0/addresses/${address}/utxos`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                project_id: 'preprod0O6SjjksMSvG9Kjq4baXnZ465Zl5Nk5V',
                "Content-Type": "application/json"
            }
        });
        return await response.json();
    } catch (error) {
        j.log({ error });
        throw new Error('Failed to fetch UTXOs.');
    }
};

/**
 * Calculate the minimum UTXO value required for a given transaction.
 * @param {Value} value - The value to include in the UTXO.
 * @returns {Promise<BigInt>} - Returns the minimum UTXO value.
 */
export const calculateMinUtxoValue = async (value) => {
    try {
        const networkParams = new hlib.NetworkParams(await fetch(txPrerequisites.networkParamsUrl).then(response => response.json()));
        return networkParams.calcMinUtxoValue(value);
    } catch (error) {
        j.log({ error });
        throw new Error('Failed to calculate minimum UTXO value.');
    }
};

/**
 * Mint a new token with a given minting script and metadata.
 * @param {string} walletName - The name of the connected wallet.
 * @param {string} tokenName - The name of the token to mint.
 * @param {string} tokenDescription - A description for the token.
 * @param {string} imageUrl - A URL for the token's image.
 * @returns {Promise<string>} - Returns the transaction hash of the minting transaction.
 */
export const mintToken = async (walletName, tokenName, tokenDescription, imageUrl) => {
    const walletData = await initializeWallet(walletName);
    const txIdHex = walletData.utxos[0].txId;
    const utxoIdx = walletData.utxos[0].outputIndex;

    const mintScript = mintAssetsScript(txIdHex, utxoIdx, tokenName);
    const compiledProgram = hlib.Program.new(mintScript).compile(true);

    const nftTokenName = hlib.ByteArrayData.fromString(tokenName).toHex();
    const tokenMetadata = {
        [compiledProgram.mintingPolicyHash.hex]: {
            [tokenName]: {
                name: tokenName,
                description: tokenDescription,
                image: imageUrl
            }
        }
    };

    return await createMintingTransaction(walletData, compiledProgram, tokenName, tokenMetadata);
};

/**
 * Initialize the wallet and retrieve essential information.
 * @param {string} walletName - The name of the connected wallet.
 * @returns {Promise<Object>} - Returns an object containing wallet data and UTXOs.
 */
export const initializeWallet = async (walletName) => {
    const wallet = await eval(`window.cardano.${walletName}`);
    const walletEnabled = await wallet.enable();
    const walletAPI = new Cip30Wallet(walletEnabled);
    const walletHelper = new WalletHelper(walletAPI);
    const utxos = await walletHelper.pickUtxos(new hlib.Value(BigInt(txPrerequisites.minAda)));
    return { wallet, walletAPI, walletHelper, utxos };
};

/**
 * Create and submit a minting transaction.
 * @param {Object} walletData - The wallet data returned from `initializeWallet`.
 * @param {Program} compiledProgram - The compiled Helios program for minting.
 * @param {string} tokenName - The name of the token being minted.
 * @param {Object} tokenMetadata - The metadata to attach to the minted token.
 * @returns {Promise<string>} - Returns the transaction hash.
 */
export const createMintingTransaction = async (walletData, compiledProgram, tokenName, tokenMetadata) => {
    const tx = new hlib.Tx();
    tx.addInputs(walletData.utxos[0]);

    const nftTokenName = hlib.ByteArrayData.fromString(tokenName).toHex();
    const nft = [[hlib.hexToBytes(nftTokenName), BigInt(1)]];
    const mintRedeemer = new hlib.ConstrData(0, []);

    tx.attachScript(compiledProgram);
    tx.mintTokens(compiledProgram.mintingPolicyHash, nft, mintRedeemer);

    const toAddress = (await walletData.walletHelper.baseAddress).toBech32();
    const minUTXOVal = await calculateMinUtxoValue(new hlib.Value(BigInt(txPrerequisites.minAda), new hlib.Assets([[compiledProgram.mintingPolicyHash, nft]])));
    tx.addOutput(new hlib.TxOutput(hlib.Address.fromBech32(toAddress), new hlib.Value(minUTXOVal, new hlib.Assets([[compiledProgram.mintingPolicyHash, nft]]))));
    tx.addMetadata(721, tokenMetadata);

    const networkParams = new hlib.NetworkParams(await fetch(txPrerequisites.networkParamsUrl).then(response => response.json()));
    await tx.finalize(networkParams, toAddress, walletData.utxos[1]);

    const signature = await walletData.walletAPI.signTx(tx);
    tx.addSignatures(signature);
    return await walletData.walletAPI.submitTx(tx);
};

/**
 * Transfer ADA or an asset to a specified address.
 * @param {string} walletName - The name of the connected wallet.
 * @param {string} toAddress - The recipient's Bech32 address.
 * @param {BigInt} amount - The amount to transfer (in lovelace for ADA or asset quantity).
 * @param {AssetClass} [assetClass] - The optional asset class for transferring tokens.
 * @returns {Promise<string>} - Returns the transaction hash of the transfer.
 */
export const transferAssets = async (walletName, toAddress, amount, assetClass = null) => {
    const walletData = await initializeWallet(walletName);
    const tx = new hlib.Tx();
    tx.addInputs(walletData.utxos[0]);

    const value = assetClass ? new hlib.Value(BigInt(0), new hlib.Assets([[assetClass.mintingPolicyHash, [[assetClass.tokenName, amount]]]])) : new hlib.Value(amount);
    tx.addOutput(new hlib.TxOutput(hlib.Address.fromBech32(toAddress), value));

    const networkParams = new hlib.NetworkParams(await fetch(txPrerequisites.networkParamsUrl).then(response => response.json()));
    await tx.finalize(networkParams, await walletData.walletHelper.changeAddress, walletData.utxos[1]);

    const signature = await walletData.walletAPI.signTx(tx);
    tx.addSignatures(signature);
    return await walletData.walletAPI.submitTx(tx);
};

/**
 * Get the balance of the wallet in lovelace (ADA).
 * @param {string} walletName - The name of the connected wallet.
 * @returns {Promise<string>} - Returns the balance in lovelace.
 */
export const getWalletBalance = async (walletName) => {
    const walletData = await initializeWallet(walletName);
    const balance = (await walletData.walletHelper.calcBalance()).lovelace.toString();
    return balance;
};

/**
 * Fetch the details of a specific asset from the Cardano blockchain.
 * @param {string} assetId - The asset ID (policy ID + hex name).
 * @returns {Promise<Object>} - Returns the asset details.
 */
export const getAssetDetails = async (assetId) => {
    try {
        const url = `https://cardano-preprod.blockfrost.io/api/v0/assets/${assetId}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                project_id: 'preprod0O6SjjksMSvG9Kjq4baXnZ465Zl5Nk5V',
                "Content-Type": "application/json"
            }
        });
        return await response.json();
    } catch (error) {
        j.log({ error });
        throw new Error('Failed to fetch asset details.');
    }
};

/**
 * Burn a specific amount of a token.
 * @param {string} walletName - The name of the connected wallet.
 * @param {string} tokenName - The name of the token to burn.
 * @param {BigInt} amount - The amount to burn.
 * @returns {Promise<string>} - Returns the transaction hash of the burn transaction.
 */
export const burnToken = async (walletName, tokenName, amount) => {
    const walletData = await initializeWallet(walletName);
    const txIdHex = walletData.utxos[0].txId;
    const utxoIdx = walletData.utxos[0].outputIndex;

    const burnScript = burnAssetsScript(txIdHex, utxoIdx, tokenName); // Assuming burnAssetsScript exists
    const compiledProgram = hlib.Program.new(burnScript).compile(true);

    const nftTokenName = hlib.ByteArrayData.fromString(tokenName).toHex();
    const nft = [[hlib.hexToBytes(nftTokenName), BigInt(-amount)]]; // Negative amount to indicate burning
    const burnRedeemer = new hlib.ConstrData(0, []);

    const tx = new hlib.Tx();
    tx.addInputs(walletData.utxos[0]);
    tx.attachScript(compiledProgram);
    tx.mintTokens(compiledProgram.mintingPolicyHash, nft, burnRedeemer);

    const networkParams = new hlib.NetworkParams(await fetch(txPrerequisites.networkParamsUrl).then(response => response.json()));
    await tx.finalize(networkParams, await walletData.walletHelper.changeAddress, walletData.utxos[1]);

    const signature = await walletData.walletAPI.signTx(tx);
    tx.addSignatures(signature);
    return await walletData.walletAPI.submitTx(tx);
};

/**
 * Create a basic payment transaction.
 * @param {string} walletName - The name of the connected wallet.
 * @param {string} toAddress - The recipient's Bech32 address.
 * @param {BigInt} amount - The amount of ADA to send (in lovelace).
 * @returns {Promise<string>} - Returns the transaction hash.
 */
export const sendAda = async (walletName, toAddress, amount) => {
    const walletData = await initializeWallet(walletName);
    const tx = new hlib.Tx();
    tx.addInputs(walletData.utxos[0]);
    tx.addOutput(new hlib.TxOutput(hlib.Address.fromBech32(toAddress), new hlib.Value(amount)));

    const networkParams = new hlib.NetworkParams(await fetch(txPrerequisites.networkParamsUrl).then(response => response.json()));
    await tx.finalize(networkParams, await walletData.walletHelper.changeAddress, walletData.utxos[1]);

    const signature = await walletData.walletAPI.signTx(tx);
    tx.addSignatures(signature);
    return await walletData.walletAPI.submitTx(tx);
};

/**
 * Retrieve the current network parameters.
 * @returns {Promise<Object>} - Returns the current network parameters.
 */
export const getNetworkParams = async () => {
    try {
        const response = await fetch(txPrerequisites.networkParamsUrl);
        return await response.json();
    } catch (error) {
        j.log({ error });
        throw new Error('Failed to fetch network parameters.');
    }
};

/**
 * Fetch the transaction history for a specific address.
 * @param {string} address - The Bech32 address to fetch the transaction history for.
 * @returns {Promise<Object[]>} - Returns an array of transaction history objects.
 */
export const fetchTxHistory = async (address) => {
    try {
        const url = `https://cardano-preprod.blockfrost.io/api/v0/addresses/${address}/transactions`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                project_id: projectID(),
                "Content-Type": "application/json"
            }
        });
        return await response.json();
    } catch (error) {
        j.log({ error });
        throw new Error('Failed to fetch transaction history.');
    }
};

/**
 * Derive an asset fingerprint for a given policy ID and token name.
 * @param {string} policyId - The policy ID.
 * @param {string} tokenName - The token name.
 * @returns {string} - Returns the asset fingerprint.
 */
export const getAssetFingerprint = (policyId, tokenName) => {
    const assetClass = new hlib.AssetClass(policyId, hlib.hexToBytes(tokenName));
    return assetClass.toFingerprint();
};

/**
 * Construct a multi-signature transaction.
 * @param {string} walletName - The name of the connected wallet.
 * @param {string[]} signers - An array of signers' Bech32 addresses.
 * @param {string} toAddress - The recipient's Bech32 address.
 * @param {BigInt} amount - The amount of ADA to send (in lovelace).
 * @returns {Promise<string>} - Returns the transaction hash.
 */
export const createMultiSigTx = async (walletName, signers, toAddress, amount) => {
    const walletData = await initializeWallet(walletName);
    const tx = new hlib.Tx();
    tx.addInputs(walletData.utxos[0]);

    tx.addOutput(new hlib.TxOutput(hlib.Address.fromBech32(toAddress), new hlib.Value(amount)));

    signers.forEach(async (signer) => {
        const signerWallet = await initializeWallet(signer);
        const signature = await signerWallet.walletAPI.signTx(tx);
        tx.addSignatures(signature);
    });

    const networkParams = new hlib.NetworkParams(await fetch(txPrerequisites.networkParamsUrl).then(response => response.json()));
    await tx.finalize(networkParams, await walletData.walletHelper.changeAddress, walletData.utxos[1]);

    return await walletData.walletAPI.submitTx(tx);
};

/**
 * Generate a random byte array.
 * @param {number} length - The length of the byte array.
 * @returns {Uint8Array} - Returns a randomly generated byte array.
 */
export const generateRandomBytes = (length) => {
    return crypto.getRandomValues(new Uint8Array(length));
};

/**
 * Hash a message using the BLAKE2b algorithm.
 * @param {Uint8Array} message - The message to hash.
 * @returns {Uint8Array} - Returns the BLAKE2b hash of the message.
 */
export const hashMessageBlake2b = (message) => {
    return hlib.Crypto.blake2b(message, 32);
};

/**
 * Convert a hexadecimal string to a byte array.
 * @param {string} hex - The hexadecimal string.
 * @returns {Uint8Array} - Returns the byte array.
 */
export const hexToByteArray = (hex) => {
    return hlib.hexToBytes(hex);
};

/**
 * Convert a byte array to a hexadecimal string.
 * @param {Uint8Array} byteArray - The byte array.
 * @returns {string} - Returns the hexadecimal string.
 */
export const byteArrayToHex = (byteArray) => {
    return hlib.bytesToHex(byteArray);
};

/**
 * Encode a message in CBOR format.
 * @param {Object} data - The data to encode.
 * @returns {Uint8Array} - Returns the CBOR-encoded byte array.
 */
export const encodeCbor = (data) => {
    return hlib.Cbor.encode(data);
};

/**
 * Decode a CBOR-encoded byte array.
 * @param {Uint8Array} cborData - The CBOR-encoded byte array.
 * @returns {Object} - Returns the decoded data object.
 */
export const decodeCbor = (cborData) => {
    return hlib.Cbor.decode(cborData);
};

/**
 * Estimate the transaction fees based on the current network parameters and transaction complexity.
 * @param {Object} tx - The transaction object to estimate fees for.
 * @param {Object} networkParams - The network parameters to use for estimation.
 * @returns {BigInt} - Returns the estimated transaction fees.
 */
export const estimateTxFees = (tx, networkParams) => {
    return hlib.Tx.estimateFee(tx, networkParams);
};
/**
 * Extract and decode metadata from a transaction.
 * @param {Object} tx - The transaction object to extract metadata from.
 * @param {Object} hlib - The Helios library instance for decoding metadata.
 * @returns {Object} - Returns the decoded metadata object.
 */
/**
 * Extract and decode metadata from a transaction.
 * @param {Object} tx - The transaction object that contains metadata.
 * @param {Object} hlib - The Helios library instance for decoding metadata.
 * @returns {Object} - Returns the decoded metadata object.
 */
export const extractMetadataFromTx = (tx, hlib) => {
    // Assuming tx.body.metadata is where metadata is stored in the transaction object
    const metadata = tx.body.metadata;

    // Decoding the metadata using Helios if it exists
    return metadata ? hlib.decodeMetadata(metadata) : null;
};