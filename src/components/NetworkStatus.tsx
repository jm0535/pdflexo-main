import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import {
  isOnline,
  isServiceWorkerSupported,
  registerNetworkStatusListeners,
  triggerSync,
} from "@/utils/offlineStorage";
import "./NetworkStatus.css";

interface NetworkStatusProps {
  className?: string;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ className = "" }) => {
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">(
    isOnline() ? "online" : "offline"
  );
  const [syncing, setSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const cleanup = registerNetworkStatusListeners(
      () => setNetworkStatus("online"),
      () => setNetworkStatus("offline")
    );

    return cleanup;
  }, []);

  const handleSyncClick = async () => {
    if (!isServiceWorkerSupported() || networkStatus === "offline") return;

    try {
      setSyncing(true);
      await triggerSync();
      // Wait a bit to show the syncing animation
      setTimeout(() => setSyncing(false), 1500);
    } catch (error) {
      console.error("Failed to trigger sync:", error);
      setSyncing(false);
    }
  };

  return (
    <div
      className={`network-status-container ${className} ${
        networkStatus === "offline" ? "offline" : "online"
      }`}
    >
      <div
        className="network-status-indicator"
        onClick={() => setShowDetails(!showDetails)}
      >
        {networkStatus === "offline" ? (
          <WifiOff className="network-status-icon offline" />
        ) : (
          <Wifi className="network-status-icon online" />
        )}
        <span className="network-status-text">
          {networkStatus === "offline" ? "Offline" : "Online"}
        </span>
      </div>

      {showDetails && (
        <div className="network-status-details">
          <div className="network-status-message">
            {networkStatus === "offline"
              ? "You are currently offline. Changes will be synchronized when you reconnect."
              : "You are connected to the internet."}
          </div>

          {networkStatus === "online" && isServiceWorkerSupported() && (
            <button
              className="sync-button"
              onClick={handleSyncClick}
              disabled={syncing}
            >
              <RefreshCw className={`sync-icon ${syncing ? "syncing" : ""}`} />
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkStatus;
