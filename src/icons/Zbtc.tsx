import { FC } from 'react'
import zbtc_icon from '/icons/zBTC.png'

interface Icon {
  height?: string
  width: string
}
const Zbtc: FC<Icon> = ({ height, width }) => {
  return (
    <div className="inline-flex items-center space-x-2">
      <img src={zbtc_icon} alt="zBTC" height={height} width={width} className="" />
      {/* <span>zBTC</span> */}
    </div>
  )
}

export default Zbtc
