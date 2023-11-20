import { connect, disconnect } from "get-starknet"
import { useState } from 'react'
import {useEffect} from 'react';
import { Routes, Route, useParams, useNavigate, useLocation } from "react-router-dom";
import {CallData, cairo } from "starknet"
import { FiSearch} from 'react-icons/fi';
import { FaTwitter } from 'react-icons/fa';
import { PulseLoader} from 'react-spinners'
import { inject } from '@vercel/analytics';
import spenderlist from "./spender.json"
import {CopyToClipboard} from 'react-copy-to-clipboard';
import Tippy from "@tippyjs/react";
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';
inject();


export const usePageTracking = () => {
  const location = useLocation();
  useEffect(() => {
    window.gtag("event", "page_view", {
      page_path: location.pathname + location.search + location.hash,
      page_search: location.search,
      page_hash: location.hash,
    });
  }, [location]);
};

function shortcut(item){
    const address = item.slice(0,4)+"..."+item.slice(-5)
    return address
  }

function ButtonConnect({setArgent, argent, isWalletConnected, setIsWalletConnected}){
  const navigate = useNavigate();
  const [value, setValue] = useState("Connect Wallet");
  const [isHovering, setIsHovering] = useState(false);
  
  try {
    if (argent.selectedAddress !== value) {
      setValue((argent.selectedAddress));}}
  catch{
    //pass
  }

  const handleMouseOver = () => {
    setIsHovering(true);
  };
  const handleMouseOut = () => {
    setIsHovering(false);
  };

  async function DisconnectWallet(){
    await disconnect({clearLastWallet:true})
    setIsWalletConnected(false)
    setValue("Connect Wallet")
    setArgent(null)
    //console.log(argent.selectedAddress)
    //console.log(value)
  }

  async function  ConnectWallet() {
    const stark = await connect()
    if (stark.isConnected===true){
      setValue((stark.selectedAddress))
      setArgent(stark)
      setIsWalletConnected(true)
      setIsHovering(false)
      navigate(`/${stark.selectedAddress}`);
    }
}


    return( isWalletConnected ?
      
  <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold ml-2 py-2 px-6 inline-flex items-center rounded-full"
         onClick={DisconnectWallet} 
         onMouseOver={handleMouseOver}
         onMouseOut={handleMouseOut}>
      <span class="mr-2">{isHovering ? "Disconnect" : (value.length > 14? shortcut(value): value)}</span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
</svg>
</button>

  :  <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold h-10 w-40 ml-2 rounded-full"
  onClick={ConnectWallet}> 
{value.length > 14? shortcut(value): value}
</button>);
}

function SearchBar() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const handleSubmit = (event) => {
    event.preventDefault();
    navigate(`/${name}`);
  }
  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
    <input 
      type="text" 
      value={name}
      className="w-full sm:w-96 px-4 py-1.5 rounded-full border-gray-300 focus:outline-none focus:ring focus:border-sky-300"
      placeholder="Search wallet address"
      onChange={(e) => setName(e.target.value)}
    />
    <button type="submit" className="ml-2 p-2 rounded-full bg-gray-200 hover:bg-gray-400 transition duration-300">
      <FiSearch className="text-gray-500" />
    </button>
  </form>
  )
}


function ButtonRevoke({argent, contract, spender, kind, address}){
    const hexToDecimal = hex => parseInt(hex, 16);
    let buttonrevoke;
    if (argent === null ){

      buttonrevoke =  
        <div className="py-3 flex justify-end px-2">
          <Tippy content="Please connect wallet">
          <div>
      < button disabled className="cursor-not-allowed bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
      onClick={handleClick}> Revoke</button>
      </div> 
      </Tippy>
    </div>
   
    }
    else{
      if ( hexToDecimal(address) === hexToDecimal(argent.selectedAddress)) {
      //console.log(hexToDecimal(address))
      //console.log(hexToDecimal(argent.selectedAddress))
      buttonrevoke = <div className="py-3 flex justify-end px-2">
      < button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
      onClick={handleClick}> Revoke</button>
    </div>
    }
      else if (hexToDecimal(address) !== hexToDecimal(argent.selectedAddress) ){
      buttonrevoke =<div className="py-3 flex justify-end px-2">
      <Tippy content="It is not connected wallet">
      <div>
  < button disabled className="cursor-not-allowed bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
  onClick={handleClick}> Revoke</button>
  </div> 
  </Tippy>
</div>
    }
    }
    
    async function handleClick() {
      let tx; 
      if (kind === "token") {
        tx = {
          contractAddress: contract,
          entrypoint: "approve",
          calldata: CallData.compile({
            spender: spender,
            amount: cairo.uint256(0)})} 
      } else {
          tx = {
          contractAddress: contract,
          entrypoint: "setApprovalForAll",
          calldata: CallData.compile({
            operator: spender,
            approved: cairo.felt(0),})} 
      }
      //console.log(contract)
      //console.log(tx)
      //console.log(address)
      await argent.account.execute(tx)}

  return(<>
    {buttonrevoke}</>
  );
}


function TableRow({item, argent, address}) {
  const [visible, setVisible] = useState(false);
  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  function formatDisplayAllowance(value) {
    if (value > 100000000) {
      return "Unlimited";
    } else if (value < 0.0001) {
     
      return value.toExponential(3);
    } else {
      
      return value.toFixed(5);
    }
  }
  
  let displayAllowance = item.allowance;
  if (item.kind === "token") {
    displayAllowance /= 10 ** item.contract_decimals;
  }
  
  displayAllowance = formatDisplayAllowance(displayAllowance);

  return (
  <tr className="border-t border-zinc-300 dark:border-zinc-500">
    <td className="overflow-hidden px-2">
      <div className="flex items-center gap-1 py-1 w-40">
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-2 text-base leading-tight">
            <div className="relative shrink-0"></div>
            <a target="_blank" rel="noopener noreferrer" href={`https://voyager.online/contract/${item.contract}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:rounded text-current visited:text-current no-underline hover:underline max-w-[8rem] lg:max-w-[12rem] truncateerilen">
                        {item.name}</a>
            </div>
          <div className="text-xs leading-tight text-zinc-500 dark:text-zinc-400 max-w-[10rem] lg:max-w-[14rem] truncate">
              {shortcut(item.contract)}
          </div>
        </div>
      </div> 
    </td>
    <td>  {item.kind === "nft" ? "NFT" : "Token" }</td>
    <td> {displayAllowance}</td>
    <td class="flex items-center py-2">
  <div class="flex flex-col">
    <div class="mb-1">
      <a target="_blank" rel="noopener noreferrer" className="no-underline hover:underline" href={`https://voyager.online/contract/${item.spender}`}>
    {spenderlist[item.spender]}
    </a>
    </div>
    <div class="text-sm text-gray-500">
      {shortcut(item.spender)}
    </div>
  </div>
  <CopyToClipboard text={item.spender}>
      <div>
      <Tippy content="Copied"  visible={visible}  animation='shift-away'>
  <button onClick={show} onMouseLeave={hide} class="ml-3">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5 inline-block">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  </button>
  </Tippy>
  </div>
  </CopyToClipboard>
  
</td>
    <td><ButtonRevoke argent={argent} kind={item.kind} contract={item.contract} spender={item.spender} address={address}/></td>
  </tr>
  );
}

function TableHeader() {
  return(
    <tr className='border-b border-black dark:border-white h-10'>
      <th className='text-left px-2 whitespace-nowrap'>
        <div className='font-bold text-left'> Asset </div>
      </th>
      <th className='text-left px-2 whitespace-nowrap'>
        <div className='font-bold text-left'> Type </div>
      </th>
      <th className='text-left px-2 whitespace-nowrap'>
        <div className='font-bold text-left'>Allowance  </div>
      </th>
      <th className='text-left px-2 whitespace-nowrap'>
        <div className='font-bold text-left'> Spender </div>
      </th>
      <th className='text-left px-6 whitespace-nowrap'>
        <div className='font-bold text-right'> Revoke </div>
      </th>
    </tr>
  );
}


function Table({setArgent, argent, isWalletConnected, setIsWalletConnected}) {
  const {address} = useParams()
  const [loading, setLoading] = useState(true);
  //console.log(loading)
  const [items, setitems] = useState([]);
  useEffect(()=>{
    setLoading(true)
    fetch(`https://api.starkrekt.com/approval/allowance?address=${address}`,{
      'methods':'GET',
      headers : {
        'Content-Type':'application/json'
      }
    })
    .then(response => response.json())
    .then(response => setitems(response)).catch(error => console.log(error)).finally(() => {
    setLoading(false);
  });

  },[address])

  const rows = [];
  items.forEach((item) => {
    if (item.allowance !== 0){
      rows.push(
        <TableRow item={item} argent={argent} address={address}/>
      );}
    });
  
  return (<div className="bg-gray-100 min-h-screen">
<div className="max-w-7xl w-full mx-auto px-4 lg:px-8 grow mb-8">
<div className="flex justify-between items-center h-24">
        <div>
          <SearchBar />
        </div>
        <div>
          <ButtonConnect setArgent={setArgent} argent={argent} isWalletConnected={isWalletConnected} setIsWalletConnected={setIsWalletConnected}/>
        </div>
      </div>
  <div className="grid-rows-1">
    <div className="max-w-7xl	border border-black dark:border-white rounded-lg overflow-auto whitespace-nowrap scrollbar-hide">
      <table className="w-full border-collapse allowances-table">
        <thead>
          <TableHeader/>
        </thead>
        <tbody>
          {loading ? null : rows}
        </tbody>
      </table>
      <div className="flex items-center justify-center min-h-200">
            {loading ? <PulseLoader color="#bdbebd" size={30} /> : null}
          </div>
    </div>
  </div>
</div>
</div>
  );
}


function Home({
  setArgent,
  argent,
  isWalletConnected,
  setIsWalletConnected
}) {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 pt-24 relative">
      {/* Top bar with ButtonConnect component */}
      <div className="absolute top-4 left-4 right-4 flex justify-end">
        <ButtonConnect
          setArgent={setArgent}
          argent={argent}
          isWalletConnected={isWalletConnected}
          setIsWalletConnected={setIsWalletConnected}
        />
      </div>

      {/* Main Content */}
      <img src="/starkrektbanner.png" alt="StarkRekt" className="mb-2 w-1/5" />
      <h1 className="text-3xl font-bold mb-2 text-center">
        Check Your Allowance Don't Be Rekt!
      </h1>
      <p className="text-center text-gray-800 mb-6">
        The dapp enables users to check and reset their token spending permissions on StarkNet.
      </p>
      <SearchBar />

      {/* Twitter Icon at bottom left */}
      <div className="absolute bottom-4 left-4">
        <a href="https://twitter.com/StarkRekt" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800">
          <FaTwitter size={28} />
        </a>
      </div>

      {/* Footer */}
      <div className="mt-auto w-full text-center text-base text-gray-600 p-4">
        <a href="https://fibrous.finance" className="hover:underline" target="_blank" rel="noopener noreferrer">
          Powered by Fibrous Finance
        </a>
      </div>
    </div>
  );
}

export default function App(){
  const [argent, setArgent] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  return(
    <Routes>
      <Route path="/" element={<Home setArgent={setArgent} argent={argent} isWalletConnected={isWalletConnected} setIsWalletConnected={setIsWalletConnected}/>}/>
      <Route path="/:address" element={<Table setArgent={setArgent} argent={argent} isWalletConnected={isWalletConnected} setIsWalletConnected={setIsWalletConnected} />}/>
    </Routes>
  )}