function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

export function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'not-supported';
    
    // Draw shapes, gradients, texts to maximize rendering differences
    canvas.width = 200;
    canvas.height = 50;
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("WhoAmI, <canvas> audit!", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("WhoAmI, <canvas> audit!", 4, 17);
    
    const dataUrl = canvas.toDataURL();
    return hashString(dataUrl);
  } catch (e) {
    return 'blocked';
  }
}

export async function getAudioFingerprint(): Promise<string> {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return 'not-supported';
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const analyser = context.createAnalyser();
    
    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;
    oscillator.connect(gain);
    gain.connect(analyser);
    
    // Analyze values without sending to speaker
    const data = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(data);
    const hash = hashString(data.join(','));
    context.close();
    return hash;
  } catch (e) {
    return 'blocked';
  }
}

export function getWebRTCLocalIPs(onIPDetected: (ip: string) => void): void {
  try {
    const RTCPeerConnectionClass = window.RTCPeerConnection || (window as any).mozRTCPeerConnection || (window as any).webkitRTCPeerConnection;
    if (!RTCPeerConnectionClass) return;
    const pc = new RTCPeerConnectionClass({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    pc.createDataChannel("");
    pc.createOffer().then(offer => pc.setLocalDescription(offer));
    pc.onicecandidate = (ice) => {
      if (!ice || !ice.candidate || !ice.candidate.candidate) return;
      const candidate = ice.candidate.candidate;
      // Regex matches IPv4 and IPv6 addresses
      const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9:]+:[a-f0-9:]+)/i;
      const match = ipRegex.exec(candidate);
      if (match && match[1]) {
        const detectedIp = match[1];
        // Only return private/local network ranges
        if (detectedIp.startsWith('192.168.') || detectedIp.startsWith('10.') || detectedIp.startsWith('172.') || detectedIp === '127.0.0.1' || detectedIp.startsWith('fe80:')) {
          onIPDetected(detectedIp);
        }
      }
    };
  } catch (e) {
    // ignore
  }
}
