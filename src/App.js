import { connect } from "@argent/get-starknet"
import { useState } from 'react'
import {useEffect} from 'react';
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import {CallData, cairo, account} from "starknet"

function ButtonConnect({setArgent}){
  const [value, setValue] = useState("Connect");
  async function  handleClick() {
    const stark = await connect()
    setValue(stark.selectedAddress)
    setArgent(stark)
}     


    return(
  <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
         onClick={handleClick}> 
      {value}
</button>
  );
}

function MyForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate(`/${name}`);
  }
    

  return (
    <form onSubmit={handleSubmit}>
      <label>Enter your name:
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <input type="submit" />
    </form>
  )
}


function ButtonRevoke({argent, contract, spender}){
    async function handleClick() {
      console.log(argent)
      //console.log(address)
      await argent.account.execute({
              contractAddress: contract,
              entrypoint: 'approve',
              calldata: CallData.compile({
                spender: spender,
                amount: cairo.uint256(0)
        })
})}
  return(
    <div className="py-3">
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
      onClick={handleClick}> Revoke</button>
    </div>
  );
}


function TableRow({item},{argent}) {
  console.log("tablooo")
  console.log(argent)
  if (item.allowance>100000000){
    item.allowance="Unlimited"
  }
  item.contract = item.contract.slice(0,5)+"..."+item.contract.slice(9,12);

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
              {item.contract}
          </div>
        </div>
      </div> 
    </td>
    <td className="overflow-hidden px-2">{item.kind}</td>
    <td>{item.allowance}</td>
    <td>{item.spender}</td>
    <ButtonRevoke argent={argent} contract={item.contract} spender={item.spender}/>

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


function Table() {
  const {address} = useParams()
 
  //console.log(address)
  const [argent, setArgent] = useState(null);
  const [items, setitems] = useState([]);
  console.log("istek öncesi")
  console.log(`https://localhost:5000/approval/allowance?address=${address}`)
  useEffect(()=>{
    fetch(`http://localhost:5000/approval/allowance?address=${address}`,{
      'methods':'GET',
      headers : {
        'Content-Type':'application/json'
      }
    })
  
    .then(response => response.json())
    .then(response => setitems(response)).catch(error => console.log(error))
  console.log("istek atıldı")
  },[address])

  const rows = [];
  items.forEach((item) => {
    if (item.allowance != 0)
      console.log(argent)
      rows.push(
        <TableRow item={item} argent={argent} />
      );
    });
  
  return (
<div className="max-w-7xl w-full mx-auto px-4 lg:px-8 grow mb-8">
  <div className="grid-rows-1 h-24">
    <div className=" grid justify-items-end">
      <ButtonConnect setArgent={setArgent}/>
    </div>  
    <MyForm></MyForm>
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
    </div>
  </div>
</div>
  );
}

function Home(){
return(<>
  <h1>HELLO</h1>
  <MyForm/>
  </>
);
}

export default function App(){
  

  return(
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/:address" element={<Table />}/>
    </Routes>
  )}