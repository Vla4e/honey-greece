// src/utils/networkSpeed.js
export function getNetworkSpeed() {
  // console.log("navigatior.connection", navigator.connection)
  if (navigator.connection && navigator.connection.downlink) {
    // console.log("Nav connection:", navigator.connection)
    return navigator.connection.downlink; // Speed in Mbps
  }
  return null;
}
