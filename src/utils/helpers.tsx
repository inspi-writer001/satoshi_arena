export const truncateBetween = (address: string): string => {
  if (address.length <= 10) return address // If address is short, no need to truncate
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const truncateEnd = (address: string, maxLength: number): string => {
  if (address.length <= maxLength) return address // If address is within max length, return as is
  return `${address.slice(0, maxLength)}...`
}
