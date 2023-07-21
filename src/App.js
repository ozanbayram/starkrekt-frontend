import { connect } from "@argent/get-starknet"
import { useState } from 'react'
import {useEffect} from 'react';
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import {CallData, cairo } from "starknet"
import { FiSearch } from 'react-icons/fi';
import { PulseLoader} from 'react-spinners'

function shortcut(item){
    const address = item.slice(0,4)+"..."+item.slice(-5)
    return address
  }

function ButtonConnect({setArgent, argent}){
  const navigate = useNavigate();
  const [value, setValue] = useState("Connect Wallet");
  try {
    if (argent.selectedAddress !== value) {
      setValue((argent.selectedAddress));}}
  catch{
    //pass
  }

  async function  handleClick() {
    const stark = await connect()
    setValue((stark.selectedAddress))
    setArgent(stark)
    if (stark.isConnected===true){
      navigate(`/${stark.selectedAddress}`);
    }
}

    return(
  <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold h-10 w-36 rounded-full"
         onClick={handleClick}> 
      {value.length > 14? shortcut(value): value}
</button>
  );
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
      className="w-96 px-4 py-1.5 rounded-full border-gray-300 focus:outline-none focus:ring focus:border-sky-300"
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
      buttonrevoke = <div className="py-3">
      <div className="group relative flex justify-center"> 
     <button disabled className="cursor-not-allowed rounded-full bg-blue-500 px-4 py-2 text-white font-bold shadow-sm">Revoke</button>
     <div className="absolute z-10 bottom-10 scale-0 rounded bg-gray-800 p-2 text-s text-white group-hover:scale-100">Please connect wallet first</div>
   </div>
     </div>
    }
    else{
      if ( hexToDecimal(address) === hexToDecimal(argent.selectedAddress)) {
      buttonrevoke = <div className="py-3">
      < button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
      onClick={handleClick}> Revoke</button>
    </div>
    }
      else if (hexToDecimal(address) !== hexToDecimal(argent.selectedAddress) ){
      buttonrevoke = <div className="py-3">
      <div className="group relative flex justify-center"> 
     <button disabled className="cursor-not-allowed rounded-full bg-blue-500 px-4 py-2 text-white font-bold shadow-sm">Revoke</button>
     <div className="absolute z-10 bottom-10 scale-0 rounded bg-gray-800 p-2 text-s text-white group-hover:scale-100">yanlış adres</div>
   </div>
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
  if (item.allowance>100000000){
    item.allowance="Unlimited"
  }

  return (
  <tr className="border-t border-zinc-300 dark:border-zinc-500">
    <td className="overflow-hidden px-2">
      <div className="flex items-center gap-1 py-1 w-40 lg:w-56">
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-2 text-base leading-tight">
            <div className="relative shrink-0"></div>
            <a className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:rounded text-current visited:text-current no-underline hover:underline max-w-[8rem] lg:max-w-[12rem] truncateerilen">
                        {item.name}</a>
            </div>
          <div className="text-xs leading-tight text-zinc-500 dark:text-zinc-400 max-w-[10rem] lg:max-w-[14rem] truncate">
              {shortcut(item.contract)}
          </div>
        </div>
      </div> 
    </td>
    <td> {item.kind}</td>
    <td> {item.allowance}</td>
    <td>{item.spender}</td>
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
      <th className='text-left px-2 whitespace-nowrap'>
        <div className='font-bold text-left'> Revoke </div>
      </th>
    </tr>
  );
}


function Table({setArgent, argent}) {
  const {address} = useParams()
  const [loading, setLoading] = useState(true);
  //console.log(address)
  const [items, setitems] = useState([]);
  useEffect(()=>{
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
  
  return (<div className="bg-gray-100">
<div className="max-w-7xl w-full mx-auto px-4 lg:px-8 grow mb-8">
  <div className="grid-rows-1 h-24">
    <div className=" grid justify-items-end">
      <ButtonConnect setArgent={setArgent} argent={argent}/>
    </div>  
    <SearchBar/>
  </div>
  <div className="grid-rows-1">
    <div className="max-w-7xl	border border-black dark:border-white rounded-lg overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <table className="w-full border-collapse allowances-table">
        <thead>
          <TableHeader/>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
      <div className="flex items-center justify-center min-h-200 py-10">
            {loading ? <PulseLoader color="#bdbebd" size={30} /> : null}
          </div>
    </div>
  </div>
</div>
</div>
  );
}


function Home({setArgent}){
return(   
  <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 pt-44">
  <div className="flex justify-end absolute top-4 right-4">
    <ButtonConnect setArgent={setArgent} />
  </div>
  <h1 className="text-3xl font-bold mb-6 text-center relative">
    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xl font-semibold text-gray-400">
      STARKREKT
    </span>
    Check Your Allowance Don't Be Rekt!
  </h1>
  <SearchBar/>
</div>
);
}

export default function App(){
  const [argent, setArgent] = useState(null);
  return(
    <Routes>
      <Route path="/" element={<Home setArgent={setArgent} />}/>
      <Route path="/:address" element={<Table setArgent={setArgent} argent={argent} />}/>
    </Routes>
  )}