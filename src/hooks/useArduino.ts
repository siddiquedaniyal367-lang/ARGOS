"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Arduino Uno USB Vendor ID
const ARDUINO_VENDOR_ID = 0x2341;

export interface PortInfo {
  usbVendorId: number | undefined;
  usbProductId: number | undefined;
  label: string;
}

export interface UseArduinoReturn {
  isSupported: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  portInfo: PortInfo | null;
  baudRate: number;
  setBaudRate: (rate: number) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  lastMessage: string | null;
  error: string | null;
}

export function useArduino(): UseArduinoReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [portInfo, setPortInfo] = useState<PortInfo | null>(null);
  const [baudRate, setBaudRate] = useState(115200);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const readingRef = useRef(false);

  // Check browser support on mount
  useEffect(() => {
    setIsSupported(typeof navigator !== "undefined" && "serial" in navigator);
  }, []);

  // Read loop — continuously read lines from the serial port
  const startReadLoop = useCallback(async (port: SerialPort) => {
    if (!port.readable) return;

    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader;
    readingRef.current = true;

    let buffer = "";

    try {
      while (readingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          const lastLine = lines[lines.length - 1]?.trim();
          if (lastLine) {
            setLastMessage(lastLine);
          }
        }
      }
    } catch {
      // Port closed or disconnected — handled by disconnect/ondisconnect
    } finally {
      reader.releaseLock();
      try {
        await readableStreamClosed;
      } catch {
        // Stream already closed
      }
    }
  }, []);

  // Connect to Arduino
  const connect = useCallback(async () => {
    if (!isSupported) {
      setError("Web Serial API is not supported in this browser.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request port — filters to Arduino USB VID for a cleaner picker list
      const port = await (navigator as Navigator & { serial: { requestPort: (opts?: { filters?: { usbVendorId?: number }[] }) => Promise<SerialPort> } }).serial.requestPort({
        filters: [{ usbVendorId: ARDUINO_VENDOR_ID }],
      });

      await port.open({ baudRate });

      portRef.current = port;

      // Gather port info
      const info = port.getInfo();
      setPortInfo({
        usbVendorId: info.usbVendorId,
        usbProductId: info.usbProductId,
        label: `USB Serial (VID:${(info.usbVendorId ?? 0).toString(16).toUpperCase().padStart(4, "0")} PID:${(info.usbProductId ?? 0).toString(16).toUpperCase().padStart(4, "0")})`,
      });

      setIsConnected(true);
      setIsConnecting(false);

      // Start reading in background
      startReadLoop(port);

      // Listen for physical disconnection
      port.addEventListener("disconnect", () => {
        setIsConnected(false);
        setPortInfo(null);
        setLastMessage(null);
        portRef.current = null;
        readingRef.current = false;
      });
    } catch (err: unknown) {
      setIsConnecting(false);
      if (err instanceof Error) {
        // User cancelled the port picker — not a real error
        if (err.name === "NotFoundError" || err.message.includes("No port selected")) {
          setError(null);
        } else {
          setError(err.message);
        }
      }
    }
  }, [isSupported, baudRate, startReadLoop]);

  // Disconnect from Arduino
  const disconnect = useCallback(async () => {
    readingRef.current = false;

    try {
      readerRef.current?.cancel();
    } catch {
      // Ignore
    }

    try {
      await portRef.current?.close();
    } catch {
      // Ignore
    }

    portRef.current = null;
    readerRef.current = null;
    setIsConnected(false);
    setPortInfo(null);
    setLastMessage(null);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      readingRef.current = false;
      readerRef.current?.cancel().catch(() => {});
      portRef.current?.close().catch(() => {});
    };
  }, []);

  return {
    isSupported,
    isConnected,
    isConnecting,
    portInfo,
    baudRate,
    setBaudRate,
    connect,
    disconnect,
    lastMessage,
    error,
  };
}
