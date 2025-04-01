// src/utils/networkSpeed.js
export function getNetworkSpeed() {
  // console.log("navigatior.connection", navigator.connection)
  if (navigator.connection && navigator.connection.downlink) {
    console.log("Nav connection:", navigator.connection)
    return navigator.connection.downlink; // Speed in Mbps
  }
  return null;
}

// network-speed-test.js
export async function testNetworkSpeedViaDownload () {
  console.log("Testing network speed.")
  try {
    const testFileUrl = '/assets/test-image.png'; // Replace with your test file URL
    const fileSizeInBytes = 1220000; // Replace with your actual file size in bytes (500KB example)
    
    const startTime = performance.now();
    
    const response = await fetch(`${testFileUrl}?cache_bust=${Date.now()}`);
    console.log("Fetch response:", response)
    if (!response.ok) {
      throw new Error('Failed to download test file');
    }
    
    // Read the response to ensure full download
    const blob = await response.blob();
    const endTime = performance.now();
    
    // Calculate speed
    const durationInSeconds = (endTime - startTime) / 1000;
    const bitsLoaded = fileSizeInBytes * 8;
    const speedMbps = (bitsLoaded / durationInSeconds / 1000000).toFixed(2);

    return {
      success: true,
      speed: speedMbps,
      message: `Network speed: ${speedMbps} Mbps`
    };
  } catch (error) {
    return {
      success: false,
      speed: 0,
      message: `Speed test failed: ${error.message}`
    };
  }
};
