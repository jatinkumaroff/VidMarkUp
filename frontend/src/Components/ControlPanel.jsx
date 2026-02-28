import React from 'react'
import Timeline from './Timeline'
import BelowButtons from './BelowButtons'
const ControlPanel = () => {
  return (
    <div className=" w-full h-[15%]  absolute bg-white/95 bottom-0 py-[1.5%] px-[1.5%] " >
       <Timeline/>
      <BelowButtons/>
    </div>
  )
}

export default ControlPanel