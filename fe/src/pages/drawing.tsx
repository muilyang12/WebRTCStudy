import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { io, Socket } from "socket.io-client";

export default function Drawing() {
  const router = useRouter();
  const { roomName } = router.query;

  const [socket, setSocket] = useState<Socket>();
  const [drawingDataChannel, setDrawingDataChannel] = useState<RTCDataChannel>();

  useEffect(() => {
    if (!roomName) return;
    if (!process.env.API_BASE_URI) throw new Error("Invalid server URI");

    const socket = io(process.env.API_BASE_URI);
    const rtcConnection = new RTCPeerConnection();

    socket.on("someone_joined", async () => {
      console.log("Someone joined. :)");

      const offer = await rtcConnection.createOffer();
      rtcConnection.setLocalDescription(offer);
      socket.emit("send_offer", offer, roomName);
      console.log("send_offer");
    });

    socket.on("receive_answer", (answer: RTCSessionDescriptionInit) => {
      console.log("receive_answer");
      rtcConnection.setRemoteDescription(answer);

      const drawingDataChannel = rtcConnection.createDataChannel(`${roomName}-drawingDataChannel`);

      drawingDataChannel.onopen = () => {
        console.log("Data chanel has opened.");
      };

      drawingDataChannel.onmessage = (event) => {
        const receivedData = event.data;
        console.log("receivedData", receivedData);
      };

      drawingDataChannel.onclose = () => {
        console.log("Data chanel has closed.");
      };

      setDrawingDataChannel(drawingDataChannel);
    });

    rtcConnection.addEventListener("icecandidate", (data: RTCPeerConnectionIceEvent) => {
      socket.emit("send_candidate", data.candidate, roomName);
      console.log("send_candidate");
    });

    socket.on("receive_candidate", (candidate: RTCIceCandidate) => {
      console.log("receive_candidate");
      rtcConnection.addIceCandidate(candidate);
    });

    setSocket(socket);
  }, [roomName]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("create_room", roomName);
    console.log("create_room");
  }, [socket]);

  return <></>;
}
