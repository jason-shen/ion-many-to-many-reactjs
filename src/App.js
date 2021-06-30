import React, { useEffect, useRef, useState } from 'react';
import { Client, LocalStream } from 'ion-sdk-js';
import { IonSFUJSONRPCSignal } from 'ion-sdk-js/lib/signal/json-rpc-impl';

let client, signal;

const App = () => {
  const [remoteStream, setRemoteStream] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [pubShow, setPubShow] = useState('hidden');
  const pubVideo = useRef();
  const remoteVideoRef =useRef([]);
  // const subVideo = useRef();

  const config = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };
  // http://localhost:8000/?publish=true
  // const URL = new URLSearchParams(window.location.search).get("publish");
  // console.log("url", URL);
  // if (URL) {
  //   isPub = true;
  // } else {
  //   isPub =false;
  // }

  useEffect(() => {
    signal = new IonSFUJSONRPCSignal("ws://localhost:7000/ws");
    client = new Client(signal, config);
    signal.onopen = () => client.join("test room");

    // if (!isPub) {
      client.ontrack = (track, stream) => {
        console.log("got track: ", track.id, "for stream: ", stream.id);
        if (track.kind === 'video') {
          track.onunmute = () => {
          setRemoteStream(remoteStream => [...remoteStream, {id: track.id, stream: stream}]);
          setCurrentVideo(track.id);
          // subVideo.current.srcObject = stream;
          // subVideo.current.autoplay = true;
          // subVideo.current.muted = false;

          stream.onremovetrack = (e) => {
            // subVideo.current.srcObject = null;
            setRemoteStream(remoteStream => remoteStream.filter(item => item.id !== e.track.id));
          }
        }
        }
      }
   // }
  }, []);

  useEffect(() => {
    const videoEl = remoteVideoRef.current[currentVideo];
    // let stream;
    remoteStream.map((ev) => {
      if (ev.id === currentVideo) {
        videoEl.srcObject = ev.stream;
      }
    })
  }, [currentVideo]);

  const start = (event) => {
    if (event) {
      LocalStream.getUserMedia({
        resolution: 'vga',
        audio: true,
        codec: "vp8"
      }).then((media) => {
      pubVideo.current.srcObject = media;
      pubVideo.current.autoplay = true;
      pubVideo.current.controls = true;
      pubVideo.current.muted = true;
      setPubShow('block');
      client.publish(media);
      }).catch(console.error);
    } else {
      LocalStream.getDisplayMedia({
        resolution: 'vga',
        video: true,
        audio: true,
        codec: "vp8"
      }).then((media) => {
      pubVideo.current.srcObject = media;
      pubVideo.current.autoplay = true;
      pubVideo.current.controls = true;
      pubVideo.current.muted = true;
      setPubShow('block');
      client.publish(media);
      }).catch(console.error);
    }
  }

  return (
    <div className="flex flex-col h-screen relative">
    <header className="flex h-16 justify-center items-center text-xl bg-black text-white">
    <div>ion-sfu</div>
        <div className="absolute top-2 right-5">
        <button id="bnt_pubcam" className="bg-blue-500 px-4 py-2 text-white rounded-lg mr-5" onClick={() => start(true)}>Publish Camera</button>
        <button id="bnt_pubscreen" className="bg-green-500 px-4 py-2 text-white rounded-lg" onClick={() => start(false)}>Publish Screen</button>
      </div>
    </header>
    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-5">
      <video className={`bg-black h-full w-full ${pubShow}`} controls ref={pubVideo}></video>
      {remoteStream.map((val, index) => {
        return (
          <video key={index} ref={(el) => remoteVideoRef.current[val.id] =el} className="bg-black w-full h-full" controls></video>
        )
      })}
      </div>
    </div>
  );
}

export default App;
