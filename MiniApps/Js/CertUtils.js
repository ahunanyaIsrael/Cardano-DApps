import {
    bytesToHex,Cip30Wallet,WalletHelper,TxOutput,
    Assets,bytesToText,hexToBytes,AssetClass,
    Tx,Address, NetworkParams, Value,MintingPolicyHash,Program,ByteArrayData,ConstrData,NetworkEmulator
} from "./helios.js";

import {opt,j} from "./jimba.js";

import  {mintAssetsScript} from './mintAssetsScript.js';

export const hlib = {
Value:Value,
Tx:Tx,
Assets:Assets,
NetworkParams : NetworkParams,
ByteArrayData : ByteArrayData,
BigInt:BigInt,
ConstrData:ConstrData,
TxOutput:TxOutput,
Address:Address,
hexToBytes:hexToBytes,
Program:Program,
MintingPolicyHash:MintingPolicyHash
}

export const txPrerequisites = {
maxTxFee : 3000000, 
minChangeAmt : 2000000, 
networkParamsUrl : "https://d1t0d7c2nekuk0.cloudfront.net/preprod.json",
minAda : 4000000	
}

const mintAssets = async (walletData,certName, courseName,recipient,date,UnId,description,imgUrl,txPrerequisites,j,hlib,txFunc,mintAssetsScript) => 
    {
        try
        {
        
            j.s("mintCNFT");
          j.log({walletData});
          j.log({txPrerequisites});
          j.log({mintAssetsScript});
          
          const maxTxFee = txPrerequisites.maxTxFee; 
          const minChangeAmt = txPrerequisites.minChangeAmt; 
          const minAda = txPrerequisites.minAda;	
          const minUTXOVal = new hlib.Value(BigInt(minAda + maxTxFee + minChangeAmt));	
          const txIdHex = walletData.utxos[0][0].txId; j.log({txIdHex});
          const utxoIdx = walletData.utxos[0][0].utxoIdx; j.log({utxoIdx})
          
  
          const mintScript = mintAssetsScript(txIdHex,utxoIdx,certName).toString(); j.log({mintScript})
  
          const nftCompiledProgram = hlib.Program.new(mintScript).compile(true); j.log({nftCompiledProgram})
          
          const tx = new hlib.Tx();
          tx.addInputs(walletData.utxos[0]);
          const nftMPH = nftCompiledProgram.mintingPolicyHash;
          tx.attachScript(nftCompiledProgram);
          const nftTokenName = hlib.ByteArrayData.fromString(certName).toHex();
          const nft = [[hlib.hexToBytes(nftTokenName), BigInt(1)]];
          const mintRedeemer = new hlib.ConstrData(0, []);
          tx.mintTokens(nftCompiledProgram.mintingPolicyHash,nft,mintRedeemer);
          const toAddress = (await walletData.walletHelper.baseAddress).toBech32(); j.log({toAddress})
          tx.addOutput(new hlib.TxOutput(hlib.Address.fromBech32(toAddress), new hlib.Value(minUTXOVal.lovelace, new hlib.Assets([[nftCompiledProgram.mintingPolicyHash, nft]]))));
          tx.addMetadata(721, {"map": [[nftCompiledProgram.mintingPolicyHash.hex, {"map": [[certName,
                                          {
                                              "map": [["name", certName],
                                                      ['Description', description],   
                                                      ['image', imgUrl],                                        
                                                      ["Course Name", courseName],                                                     
                                                      ["Recipient", recipient],
                                                      ['date',date],
                                                      ['UnId', UnId],
                                                  ]
                                          }
                                      ]]}
                                      ]]
                              }
                      );
  
           const txh = txFunc(walletData,hlib,tx,j,txPrerequisites.networkParamsUrl);
          j.s("mintCNFT");
        } catch (error) {
          const errorMsg = await error.info;
           j.log({errorMsg});
      }
  }
  
  export const mint = async (certName, courseName,recipient,date,UnId,description,imgUrl)=>{ 
  const wallet =  await init(j);
  j.test("coxylib testPack", "init",wallet).eq("lace")
  
  const walletData = await walletEssentials(wallet,Cip30Wallet,WalletHelper,Value,txPrerequisites.minAda,j); j.log({walletData})
  //j.test("coxylib testPack","walletEssentials walletEnabled",walletData.walletEnabled).notBool() 
  
   mintAssets(
          walletData,
          certName, 
          courseName,
          recipient,
          date,
          UnId,
          description,
          imgUrl,
          txPrerequisites,
          j,
          hlib,
          txFunc,
          mintAssetsScript
      )
  }
  
  export function hexToTex(hexx) {
      const hex = hexx.toString();
      let str = '';
      for (let i = 0; i < hex.length; i += 2)
      {
          str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      return str;
  }
  
  export async function init(j) {  j.s("init");
  
  try 
  {
      const started = "...started"; j.log({started});
  
      const cwindow = window.cardano; j.log({cwindow})
              
      if(typeof cwindow != 'undefined')
      {
  
          if(window.cardano.nami)
          {
              return  "nami";
          }
          else if(window.cardano.eternl)
          {
              return  "eternl";
          }
          else if(window.cardano.lace)
          {
              return  "lace";
          }
          else if(window.cardano.flint)
          {
              return  "flint";
          }
          else if(window.cardano.nufi)
          {
              return  "nufi";
          }
          else if(window.cardano.yoroi)
          {
              return  "yoroi";
          }
          else
          {
              return null;
          }
  
      }
      else
      {				
          alert("Sorry you need to connect to browsers wallets: Nami/Eternl/Lace in preprod network");
          
          return null;
      }
  
      j.e("init");
  } 
  catch (error) 
  {
          console.log({error});		
          return null;
          
  }
  }
  
  export async function walletEssentials(selectedWallet,Cip30Wallet,WalletHelper,Value,utxoAmount,j) 
  {
      try
      {
           j.test("showWalletData","selectedWallet",selectedWallet).string();
           j.test("showWalletData",'jimba j',j).object();
           j.test("showWalletData","utxoAmount",utxoAmount).geq(0);
      
          const wallet = await eval('window.cardano.'+selectedWallet); j.log({wallet});j.test("WalletEssentials","wallet",wallet).object();
      
          const walletEnabled = await wallet.isEnabled(); j.log({walletEnabled});j.check(selectedWallet+"wallet Enabled",walletEnabled,true);	
          
          if(!walletEnabled)
          {
              const iwe = await wallet.enable();j.log({iwe}); window.location.reload();
          }
          
          if(walletEnabled)
          {			
              const walletHandler = (await wallet.enable()); j.test("walletEssentials","walletHandler",walletHandler).object()
              const walletAPI = await new Cip30Wallet(walletHandler);j.log({walletAPI}) ;
              const walletHelper = new WalletHelper(walletAPI); j.log({walletHelper});
              const utxos = await walletHelper.pickUtxos(new Value(BigInt(utxoAmount)));j.log({utxos});
              const resObject = {wallet:wallet,walletEnabled:walletEnabled,walletHelper:walletHelper,walletHandler:walletHandler,walletAPI:walletAPI,utxos:utxos}; 
      
              return resObject;
          }
          else
          {
              return null;
          }
      } 
      catch (error) 
      {
          console.log({error});	
          return null;	
      }
  
  }
  export const txFunc = async(walletData,hlib,tx,j,networkParamsUrl)=>{

    const networkParams = new hlib.NetworkParams(await fetch(networkParamsUrl).then(response => response.json())); j.log({networkParams})
    const spareUtxo =  walletData.utxos[1]; j.log({spareUtxo});
    const txBeforeFinal = tx.dump(); j.log({txBeforeFinal})
    const fnAddress =  await walletData.walletHelper.changeAddress; j.log({fnAddress})
    await tx.finalize(networkParams, fnAddress,spareUtxo);
    const signature = await walletData.walletAPI.signTx(tx); j.log({signature});	
    tx.addSignatures(signature);		
    const txHash = (await walletData.walletAPI.submitTx(tx)).toHex();j.log({txHash});

	return txHash;
}  